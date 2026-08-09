export const RHIA_PRODUCT_NAME = "RHIA 2.0" as const;
export const RHIA_VERSION = "0.2.0" as const;
export const RHIA_STAGE = 1 as const;
export const RHIA_SCHEMA_VERSION = 1 as const;

export const RHIA_RUNTIME = {
  sourceOfTruth: "indexeddb",
  cloudRuntime: false,
  externalAi: false,
  persistence: true,
} as const;

export type RhiaRuntime = typeof RHIA_RUNTIME;

export const ENTITY_TYPES = ["area", "source", "note", "audit-entry"] as const;
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

export type PersistedEntity = Area | Source | Note | AuditEntry;

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
