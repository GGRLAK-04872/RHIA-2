export const RHIA_PRODUCT_NAME = "RHIA 2.0" as const;
export const RHIA_VERSION = "0.2.0" as const;
export const RHIA_STAGE = 2 as const;
export const RHIA_SCHEMA_VERSION = 1 as const;

export const RHIA_RUNTIME = {
  sourceOfTruth: "indexeddb",
  cloudRuntime: false,
  externalAi: false,
  persistence: true,
} as const;

export type RhiaRuntime = typeof RHIA_RUNTIME;

export const ENTITY_TYPES = [
  "area",
  "source",
  "note",
  "audit-entry",
  "memory-fact",
  "decision",
  "memory-conflict",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface EntityBase<TType extends EntityType> {
  id: string;
  type: TType;
  schemaVersion: typeof RHIA_SCHEMA_VERSION;
  revision: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type AreaStatus = "active" | "archived";

export interface Area extends EntityBase<"area"> {
  name: string;
  description: string | null;
  status: AreaStatus;
}

export type SourceKind = "manual" | "import" | "system";

export interface Source extends EntityBase<"source"> {
  kind: SourceKind;
  label: string;
  reference: string | null;
}

export type NoteStatus = "active" | "archived";

export interface Note extends EntityBase<"note"> {
  areaId: string;
  sourceId: string | null;
  title: string;
  body: string;
  status: NoteStatus;
}

export type AuditAction = "create" | "update" | "delete" | "restore" | "purge";

export interface AuditEntry extends EntityBase<"audit-entry"> {
  entityType: EntityType;
  entityId: string;
  entityRevision: number;
  action: AuditAction;
  occurredAt: string;
  summary: string | null;
}

export type MemoryConfirmationActor = "sir";
export type MemoryFactStatus = "proposed" | "confirmed" | "disputed" | "superseded" | "deleted";

export interface MemoryFact extends EntityBase<"memory-fact"> {
  areaId: string;
  sourceIds: string[];
  originDeviceId: string;
  knowledgeType: string;
  subject: string;
  predicate: string;
  value: string;
  conflictKey: string;
  displayText: string;
  status: MemoryFactStatus;
  validFrom: string | null;
  validUntil: string | null;
  confirmedAt: string | null;
  confirmedBy: MemoryConfirmationActor | null;
  supersedesId: string | null;
}

export type DecisionStatus = "proposed" | "confirmed" | "superseded" | "revoked" | "deleted";

export interface Decision extends EntityBase<"decision"> {
  areaId: string;
  sourceIds: string[];
  originDeviceId: string;
  title: string;
  decisionText: string;
  rationale: string;
  status: DecisionStatus;
  validFrom: string | null;
  validUntil: string | null;
  confirmedAt: string | null;
  confirmedBy: MemoryConfirmationActor | null;
  supersedesId: string | null;
}

export type MemoryConflictStatus = "open" | "resolved" | "dismissed";
export type MemoryConflictResolution = "keep-fact" | "replace-both" | "not-a-conflict";

export interface MemoryConflict extends EntityBase<"memory-conflict"> {
  areaId: string;
  originDeviceId: string;
  conflictKey: string;
  factIds: string[];
  status: MemoryConflictStatus;
  detectedAt: string;
  resolvedAt: string | null;
  resolvedBy: MemoryConfirmationActor | null;
  resolution: MemoryConflictResolution | null;
  resolvedFactId: string | null;
  note: string | null;
}

export type PersistedEntity =
  | Area
  | Source
  | Note
  | AuditEntry
  | MemoryFact
  | Decision
  | MemoryConflict;

export interface EntityFactoryOptions {
  id?: string;
  timestamp?: string;
}

export interface CreateAreaInput {
  name: string;
  description?: string | null;
  status?: AreaStatus;
}

export interface CreateSourceInput {
  kind: SourceKind;
  label: string;
  reference?: string | null;
}

export interface CreateNoteInput {
  areaId: string;
  sourceId?: string | null;
  title: string;
  body: string;
  status?: NoteStatus;
}

export interface CreateAuditEntryInput {
  entityType: EntityType;
  entityId: string;
  entityRevision: number;
  action: AuditAction;
  occurredAt?: string;
  summary?: string | null;
}

export interface MemoryEntityFactoryOptions extends EntityFactoryOptions {
  originDeviceId: string;
}

export interface CreateMemoryFactInput {
  areaId: string;
  sourceIds: string[];
  knowledgeType: string;
  subject: string;
  predicate: string;
  value: string;
  conflictKey: string;
  displayText: string;
  validFrom?: string | null;
  validUntil?: string | null;
  supersedesId?: string | null;
}

export interface CreateDecisionInput {
  areaId: string;
  sourceIds: string[];
  title: string;
  decisionText: string;
  rationale: string;
  validFrom?: string | null;
  validUntil?: string | null;
  supersedesId?: string | null;
}

export interface CreateMemoryConflictInput {
  areaId: string;
  conflictKey: string;
  factIds: string[];
  status?: MemoryConflictStatus;
  detectedAt?: string;
  resolvedAt?: string | null;
  resolvedBy?: MemoryConfirmationActor | null;
  resolution?: MemoryConflictResolution | null;
  resolvedFactId?: string | null;
  note?: string | null;
}

function createEnvelope<TType extends EntityType>(
  type: TType,
  options: EntityFactoryOptions,
): EntityBase<TType> {
  const timestamp = options.timestamp ?? new Date().toISOString();
  const id = options.id ?? globalThis.crypto.randomUUID();

  return {
    id,
    type,
    schemaVersion: RHIA_SCHEMA_VERSION,
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
}

export function createArea(input: CreateAreaInput, options: EntityFactoryOptions = {}): Area {
  return {
    ...createEnvelope("area", options),
    name: input.name,
    description: input.description ?? null,
    status: input.status ?? "active",
  };
}

export function createSource(input: CreateSourceInput, options: EntityFactoryOptions = {}): Source {
  return {
    ...createEnvelope("source", options),
    kind: input.kind,
    label: input.label,
    reference: input.reference ?? null,
  };
}

export function createNote(input: CreateNoteInput, options: EntityFactoryOptions = {}): Note {
  return {
    ...createEnvelope("note", options),
    areaId: input.areaId,
    sourceId: input.sourceId ?? null,
    title: input.title,
    body: input.body,
    status: input.status ?? "active",
  };
}

export function createAuditEntry(
  input: CreateAuditEntryInput,
  options: EntityFactoryOptions = {},
): AuditEntry {
  const envelope = createEnvelope("audit-entry", options);

  return {
    ...envelope,
    entityType: input.entityType,
    entityId: input.entityId,
    entityRevision: input.entityRevision,
    action: input.action,
    occurredAt: input.occurredAt ?? envelope.createdAt,
    summary: input.summary ?? null,
  };
}

export function createMemoryFact(
  input: CreateMemoryFactInput,
  options: MemoryEntityFactoryOptions,
): MemoryFact {
  return {
    ...createEnvelope("memory-fact", options),
    areaId: input.areaId,
    sourceIds: [...input.sourceIds],
    originDeviceId: options.originDeviceId,
    knowledgeType: input.knowledgeType,
    subject: input.subject,
    predicate: input.predicate,
    value: input.value,
    conflictKey: input.conflictKey,
    displayText: input.displayText,
    status: "proposed",
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
    confirmedAt: null,
    confirmedBy: null,
    supersedesId: input.supersedesId ?? null,
  };
}

export function createDecision(
  input: CreateDecisionInput,
  options: MemoryEntityFactoryOptions,
): Decision {
  return {
    ...createEnvelope("decision", options),
    areaId: input.areaId,
    sourceIds: [...input.sourceIds],
    originDeviceId: options.originDeviceId,
    title: input.title,
    decisionText: input.decisionText,
    rationale: input.rationale,
    status: "proposed",
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
    confirmedAt: null,
    confirmedBy: null,
    supersedesId: input.supersedesId ?? null,
  };
}

export function createMemoryConflict(
  input: CreateMemoryConflictInput,
  options: MemoryEntityFactoryOptions,
): MemoryConflict {
  const envelope = createEnvelope("memory-conflict", options);

  return {
    ...envelope,
    areaId: input.areaId,
    originDeviceId: options.originDeviceId,
    conflictKey: input.conflictKey,
    factIds: [...input.factIds],
    status: input.status ?? "open",
    detectedAt: input.detectedAt ?? envelope.createdAt,
    resolvedAt: input.resolvedAt ?? null,
    resolvedBy: input.resolvedBy ?? null,
    resolution: input.resolution ?? null,
    resolvedFactId: input.resolvedFactId ?? null,
    note: input.note ?? null,
  };
}

export interface RepositoryReadOptions {
  includeDeleted?: boolean;
}

export interface EntityRepository<TEntity extends PersistedEntity> {
  getById(id: string, options?: RepositoryReadOptions): Promise<TEntity | undefined>;
  list(options?: RepositoryReadOptions): Promise<TEntity[]>;
  create(entity: TEntity): Promise<TEntity>;
  replace(entity: TEntity, expectedRevision: number): Promise<TEntity>;
  softDelete(id: string, expectedRevision: number): Promise<TEntity>;
  restore(id: string, expectedRevision: number): Promise<TEntity>;
  hardDelete(id: string, expectedRevision: number): Promise<void>;
}

export const REPOSITORY_ERROR_CODES = [
  "RECORD_NOT_FOUND",
  "RECORD_ALREADY_EXISTS",
  "REVISION_CONFLICT",
  "VALIDATION_FAILED",
  "PERSISTENCE_UNAVAILABLE",
  "BACKUP_INVALID",
  "BACKUP_CHECKSUM_MISMATCH",
  "IMPORT_CONFLICT",
  "CONFIRMATION_REQUIRED",
  "INVALID_STATE_TRANSITION",
] as const;

export type RepositoryErrorCode = (typeof REPOSITORY_ERROR_CODES)[number];

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RepositoryError";
    this.code = code;
  }
}

export type MemoryProposal = MemoryFact | Decision;
export type ConfirmedMemoryRecord = MemoryFact | Decision;

export interface ExplicitMemoryConfirmation {
  actor: MemoryConfirmationActor;
  explicitlyConfirmed: true;
  confirmedAt: string;
}

export function assertPendingMemoryProposal(proposal: MemoryProposal): void {
  if (proposal.status !== "proposed" || proposal.deletedAt !== null) {
    throw new RepositoryError(
      "INVALID_STATE_TRANSITION",
      "Nur ein offener Gedächtnisvorschlag kann bestätigt oder abgelehnt werden.",
    );
  }
}

export function assertActiveConfirmedMemoryRecord(record: ConfirmedMemoryRecord): void {
  if (record.status !== "confirmed" || record.deletedAt !== null) {
    throw new RepositoryError(
      "INVALID_STATE_TRANSITION",
      "Nur eine aktive bestätigte Gedächtnisfassung kann korrigiert, ersetzt oder verworfen werden.",
    );
  }
}

function assertExplicitMemoryConfirmation(confirmation: ExplicitMemoryConfirmation): void {
  if (confirmation.actor !== "sir" || confirmation.explicitlyConfirmed !== true) {
    throw new RepositoryError(
      "CONFIRMATION_REQUIRED",
      "Gedächtniswissen wird erst nach ausdrücklicher Bestätigung durch Sir aktiviert.",
    );
  }
}

export function confirmMemoryFactProposal(
  fact: MemoryFact,
  confirmation: ExplicitMemoryConfirmation,
): MemoryFact {
  assertPendingMemoryProposal(fact);
  assertExplicitMemoryConfirmation(confirmation);

  return {
    ...fact,
    status: "confirmed",
    confirmedAt: confirmation.confirmedAt,
    confirmedBy: confirmation.actor,
  };
}

export function confirmDecisionProposal(
  decision: Decision,
  confirmation: ExplicitMemoryConfirmation,
): Decision {
  assertPendingMemoryProposal(decision);
  assertExplicitMemoryConfirmation(confirmation);

  return {
    ...decision,
    status: "confirmed",
    confirmedAt: confirmation.confirmedAt,
    confirmedBy: confirmation.actor,
  };
}

export function supersedeMemoryFact(fact: MemoryFact): MemoryFact {
  assertActiveConfirmedMemoryRecord(fact);

  return {
    ...fact,
    status: "superseded",
  };
}

export function supersedeDecision(decision: Decision): Decision {
  assertActiveConfirmedMemoryRecord(decision);

  return {
    ...decision,
    status: "superseded",
  };
}

export function revokeDecision(decision: Decision): Decision {
  assertActiveConfirmedMemoryRecord(decision);

  return {
    ...decision,
    status: "revoked",
  };
}
