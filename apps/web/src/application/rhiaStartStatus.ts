import { RHIA_RUNTIME, RHIA_STAGE, RHIA_VERSION } from "@rhia/domain";
import { RHIA_SECURITY_POLICY } from "@rhia/security";

export const RHIA_START_STATUS_FILE = "rhia-start-status.json" as const;

const capabilityNames = [
  "companyCockpit",
  "memory",
  "tasks",
  "planning",
  "dataBackup",
  "oneShotBrowserSpeech",
  "externalAi",
  "cloudSync",
  "externalIntegrations",
  "externalWriteActions",
  "wakeWord",
] as const;

export type RhiaCapabilityName = (typeof capabilityNames)[number];
export type RhiaCapabilityStatus = "allowed" | "blocked";

export interface RhiaStartStatus {
  schemaVersion: 1;
  source: {
    document: "RHIA_ONE_START_CURRENT.md";
    documentVersion: string;
    lastVerified: string;
  };
  identity: {
    name: "RHIA";
    role: "personal-controlled-assistant";
    roleLabel: string;
    ownerSalutation: "Sir";
  };
  runtime: {
    mode: "work";
    modeLabel: "Arbeitsmodus";
    productVersion: typeof RHIA_VERSION;
    stage: typeof RHIA_STAGE;
    dataSource: typeof RHIA_RUNTIME.sourceOfTruth;
    apiBudgetEuro: 0;
  };
  capabilities: Record<RhiaCapabilityName, RhiaCapabilityStatus>;
}

export type RhiaStartStatusErrorCode = "unavailable" | "invalid" | "conflict";

export class RhiaStartStatusError extends Error {
  public constructor(public readonly code: RhiaStartStatusErrorCode) {
    const messages: Record<RhiaStartStatusErrorCode, string> = {
      unavailable: "Die zentrale Startdatei ist nicht verfügbar.",
      invalid: "Die zentrale Startdatei ist ungültig.",
      conflict: "Die zentrale Startdatei widerspricht dem freigegebenen Produktstand.",
    };
    super(messages[code]);
    this.name = "RhiaStartStatusError";
  }
}

type FetchStartStatus = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(record: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(record).sort();
  const expectedKeys = [...keys].sort();
  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseStartStatus(value: unknown): RhiaStartStatus {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["schemaVersion", "source", "identity", "runtime", "capabilities"]) ||
    value.schemaVersion !== 1 ||
    !isRecord(value.source) ||
    !isRecord(value.identity) ||
    !isRecord(value.runtime) ||
    !isRecord(value.capabilities)
  ) {
    throw new RhiaStartStatusError("invalid");
  }

  const { source, identity, runtime, capabilities } = value;

  if (
    !hasExactKeys(source, ["document", "documentVersion", "lastVerified"]) ||
    source.document !== "RHIA_ONE_START_CURRENT.md" ||
    typeof source.documentVersion !== "string" ||
    source.documentVersion.length === 0 ||
    !isIsoDate(source.lastVerified) ||
    !hasExactKeys(identity, ["name", "role", "roleLabel", "ownerSalutation"]) ||
    identity.name !== "RHIA" ||
    identity.role !== "personal-controlled-assistant" ||
    typeof identity.roleLabel !== "string" ||
    identity.roleLabel.length === 0 ||
    identity.ownerSalutation !== "Sir" ||
    !hasExactKeys(runtime, [
      "mode",
      "modeLabel",
      "productVersion",
      "stage",
      "dataSource",
      "apiBudgetEuro",
    ]) ||
    runtime.mode !== "work" ||
    runtime.modeLabel !== "Arbeitsmodus" ||
    typeof runtime.productVersion !== "string" ||
    typeof runtime.stage !== "number" ||
    typeof runtime.dataSource !== "string" ||
    runtime.apiBudgetEuro !== 0 ||
    !hasExactKeys(capabilities, capabilityNames) ||
    capabilityNames.some(
      (name) => capabilities[name] !== "allowed" && capabilities[name] !== "blocked",
    )
  ) {
    throw new RhiaStartStatusError("invalid");
  }

  const status = value as unknown as RhiaStartStatus;
  const conflictsWithProduct =
    status.runtime.productVersion !== RHIA_VERSION ||
    status.runtime.stage !== RHIA_STAGE ||
    status.runtime.dataSource !== RHIA_RUNTIME.sourceOfTruth ||
    status.capabilities.companyCockpit !== "allowed" ||
    status.capabilities.externalAi !== (RHIA_RUNTIME.externalAi ? "allowed" : "blocked") ||
    status.capabilities.cloudSync !== (RHIA_RUNTIME.cloudRuntime ? "allowed" : "blocked") ||
    status.capabilities.externalIntegrations !==
      (RHIA_SECURITY_POLICY.externalRequestsAllowed ? "allowed" : "blocked") ||
    status.capabilities.externalWriteActions !== "blocked" ||
    status.capabilities.wakeWord !== "blocked";

  if (conflictsWithProduct) {
    throw new RhiaStartStatusError("conflict");
  }

  return status;
}

export async function loadRhiaStartStatus(
  fetchStartStatus: FetchStartStatus = window.fetch.bind(window),
  baseUrl = import.meta.env.BASE_URL,
): Promise<RhiaStartStatus> {
  let response: Response;

  try {
    response = await fetchStartStatus(`${baseUrl}${RHIA_START_STATUS_FILE}`, {
      cache: "no-cache",
      credentials: "same-origin",
    });
  } catch {
    throw new RhiaStartStatusError("unavailable");
  }

  if (!response.ok) {
    throw new RhiaStartStatusError("unavailable");
  }

  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new RhiaStartStatusError("invalid");
  }

  return parseStartStatus(value);
}
