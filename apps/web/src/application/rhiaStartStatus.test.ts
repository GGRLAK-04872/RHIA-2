import { describe, expect, it, vi } from "vitest";
import { loadRhiaStartStatus, RhiaStartStatusError, type RhiaStartStatus } from "./rhiaStartStatus";

export const validRhiaStartStatus = {
  schemaVersion: 1,
  source: {
    document: "RHIA_ONE_START_CURRENT.md",
    documentVersion: "1.1",
    lastVerified: "2026-08-15",
  },
  identity: {
    name: "RHIA",
    role: "personal-controlled-assistant",
    roleLabel: "Persönliche, kontrollierbare Assistentin für Sir",
    ownerSalutation: "Sir",
  },
  runtime: {
    mode: "work",
    modeLabel: "Arbeitsmodus",
    productVersion: "0.4.1",
    stage: 4,
    dataSource: "indexeddb",
    apiBudgetEuro: 0,
  },
  capabilities: {
    companyCockpit: "allowed",
    memory: "allowed",
    tasks: "allowed",
    planning: "allowed",
    dataBackup: "allowed",
    oneShotBrowserSpeech: "allowed",
    externalAi: "blocked",
    cloudSync: "blocked",
    externalIntegrations: "blocked",
    externalWriteActions: "blocked",
    wakeWord: "blocked",
  },
} as const satisfies RhiaStartStatus;

describe("RHIA start status", () => {
  it("loads and validates the central start file", async () => {
    const fetchStartStatus = vi.fn(async () =>
      Response.json(validRhiaStartStatus, { status: 200 }),
    );

    await expect(loadRhiaStartStatus(fetchStartStatus, "/RHIA-2/")).resolves.toEqual(
      validRhiaStartStatus,
    );
    expect(fetchStartStatus).toHaveBeenCalledWith("/RHIA-2/rhia-start-status.json", {
      cache: "no-cache",
      credentials: "same-origin",
    });
  });

  it("reports a missing start file without a fallback", async () => {
    const fetchStartStatus = vi.fn(async () => new Response(null, { status: 404 }));

    await expect(loadRhiaStartStatus(fetchStartStatus, "/")).rejects.toMatchObject({
      code: "unavailable",
    });
  });

  it("blocks startup when the file contradicts the product stage", async () => {
    const fetchStartStatus = vi.fn(async () =>
      Response.json(
        {
          ...validRhiaStartStatus,
          runtime: { ...validRhiaStartStatus.runtime, stage: 5 },
        },
        { status: 200 },
      ),
    );

    await expect(loadRhiaStartStatus(fetchStartStatus, "/")).rejects.toEqual(
      new RhiaStartStatusError("conflict"),
    );
  });
});
