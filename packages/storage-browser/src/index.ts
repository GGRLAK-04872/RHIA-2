import {
  areaSchema,
  auditEntrySchema,
  noteSchema,
  rhiaBackupPackageSchema,
  sourceSchema,
  type RhiaBackupData,
  type RhiaBackupPackage,
} from "@rhia/contracts";
import {
  ENTITY_TYPES,
  RHIA_SCHEMA_VERSION,
  RepositoryError,
  type Area,
  type AuditEntry,
  type EntityRepository,
  type EntityType,
  type Note,
  type PersistedEntity,
  type RepositoryReadOptions,
  type Source,
} from "@rhia/domain";
import Dexie, { type Table, type TransactionMode } from "dexie";

export const RHIA_BROWSER_DATABASE_NAME = "rhia-2" as const;
export const RHIA_BROWSER_DATABASE_VERSION = 2 as const;
export const RHIA_BACKUP_FORMAT_VERSION = 1 as const;
export const RHIA_TRASH_RETENTION_DAYS = 30 as const;
export const DELETE_ALL_CONFIRMATION = "RHIA LOKALDATEN LÖSCHEN" as const;

const LEGACY_VERSION_ONE_STORES = {
  areas: "&id, name",
  sources: "&id, label",
  notes: "&id, areaId",
  auditEntries: "&id, entityId",
} as const;

const CURRENT_STORES = {
  areas: "&id, type, name, status, updatedAt, deletedAt, revision",
  sources: "&id, type, kind, label, updatedAt, deletedAt, revision",
  notes: "&id, type, areaId, sourceId, status, updatedAt, deletedAt, revision, [areaId+updatedAt]",
  auditEntries:
    "&id, type, entityType, entityId, action, occurredAt, updatedAt, [entityType+entityId]",
} as const;

type EntitySchema<TEntity> = {
  parse(value: unknown): TEntity;
};

type Clock = () => string;

export class RhiaBrowserDatabase extends Dexie {
  areas!: Table<Area, string>;
  sources!: Table<Source, string>;
  notes!: Table<Note, string>;
  auditEntries!: Table<AuditEntry, string>;

  constructor(databaseName: string = RHIA_BROWSER_DATABASE_NAME) {
    super(databaseName);

    this.version(1).stores(LEGACY_VERSION_ONE_STORES);
    this.version(RHIA_BROWSER_DATABASE_VERSION)
      .stores(CURRENT_STORES)
      .upgrade(async (transaction) => {
        const migratedAt = new Date().toISOString();
        const normalizeBase = (record: Record<string, unknown>, type: string) => {
          record.type = type;
          record.schemaVersion = RHIA_SCHEMA_VERSION;
          record.revision = typeof record.revision === "number" ? record.revision : 1;
          record.createdAt = typeof record.createdAt === "string" ? record.createdAt : migratedAt;
          record.updatedAt =
            typeof record.updatedAt === "string" ? record.updatedAt : record.createdAt;
          record.deletedAt = typeof record.deletedAt === "string" ? record.deletedAt : null;
        };

        await transaction
          .table<Record<string, unknown>, string>("areas")
          .toCollection()
          .modify((record) => {
            normalizeBase(record, "area");
            record.description = typeof record.description === "string" ? record.description : null;
            record.status = record.status === "archived" ? "archived" : "active";
          });
        await transaction
          .table<Record<string, unknown>, string>("sources")
          .toCollection()
          .modify((record) => {
            normalizeBase(record, "source");
            record.kind = ["manual", "import", "system"].includes(String(record.kind))
              ? record.kind
              : "manual";
            record.reference = typeof record.reference === "string" ? record.reference : null;
          });
        await transaction
          .table<Record<string, unknown>, string>("notes")
          .toCollection()
          .modify((record) => {
            normalizeBase(record, "note");
            record.sourceId = typeof record.sourceId === "string" ? record.sourceId : null;
            record.title = typeof record.title === "string" ? record.title : "Migrierte Notiz";
            record.body = typeof record.body === "string" ? record.body : "";
            record.status = record.status === "archived" ? "archived" : "active";
          });
        await transaction
          .table<Record<string, unknown>, string>("auditEntries")
          .toCollection()
          .modify((record) => {
            normalizeBase(record, "audit-entry");
            record.entityType = ENTITY_TYPES.includes(record.entityType as EntityType)
              ? record.entityType
              : "note";
            record.entityRevision =
              typeof record.entityRevision === "number" ? record.entityRevision : 1;
            record.action = ["create", "update", "delete", "restore", "purge"].includes(
              String(record.action),
            )
              ? record.action
              : "update";
            record.occurredAt =
              typeof record.occurredAt === "string" ? record.occurredAt : record.createdAt;
            record.summary = typeof record.summary === "string" ? record.summary : null;
          });
      });
  }
}

class DexieEntityRepository<TEntity extends PersistedEntity> implements EntityRepository<TEntity> {
  constructor(
    private readonly database: RhiaBrowserDatabase,
    private readonly table: Table<TEntity, string>,
    private readonly schema: EntitySchema<TEntity>,
    private readonly now: Clock,
  ) {}

  async getById(id: string, options: RepositoryReadOptions = {}): Promise<TEntity | undefined> {
    const entity = await this.table.get(id);

    if (entity?.deletedAt && !options.includeDeleted) {
      return undefined;
    }

    return entity;
  }

  async list(options: RepositoryReadOptions = {}): Promise<TEntity[]> {
    const entities = await this.table.orderBy("updatedAt").reverse().toArray();

    return options.includeDeleted ? entities : entities.filter((entity) => !entity.deletedAt);
  }

  async create(entity: TEntity): Promise<TEntity> {
    const validEntity = this.parse(entity);

    if (validEntity.revision !== 1) {
      throw new RepositoryError(
        "VALIDATION_FAILED",
        "Ein neuer Datensatz muss mit Revision 1 beginnen.",
      );
    }

    try {
      await this.table.add(validEntity);
      return validEntity;
    } catch (error) {
      if (error instanceof Dexie.ConstraintError) {
        throw new RepositoryError(
          "RECORD_ALREADY_EXISTS",
          `Der Datensatz ${validEntity.id} existiert bereits.`,
          { cause: error },
        );
      }
      throw error;
    }
  }

  async replace(entity: TEntity, expectedRevision: number): Promise<TEntity> {
    return this.database.transaction("rw", this.table, async () => {
      const current = await this.requireCurrent(entity.id, expectedRevision);
      const next = this.parse({
        ...entity,
        id: current.id,
        type: current.type,
        schemaVersion: RHIA_SCHEMA_VERSION,
        revision: current.revision + 1,
        createdAt: current.createdAt,
        updatedAt: this.now(),
        deletedAt: current.deletedAt,
      });

      await this.table.put(next);
      return next;
    });
  }

  async softDelete(id: string, expectedRevision: number): Promise<TEntity> {
    return this.changeDeletedAt(id, expectedRevision, this.now());
  }

  async restore(id: string, expectedRevision: number): Promise<TEntity> {
    return this.changeDeletedAt(id, expectedRevision, null);
  }

  async hardDelete(id: string, expectedRevision: number): Promise<void> {
    await this.database.transaction("rw", this.table, async () => {
      await this.requireCurrent(id, expectedRevision);
      await this.table.delete(id);
    });
  }

  private async changeDeletedAt(
    id: string,
    expectedRevision: number,
    deletedAt: string | null,
  ): Promise<TEntity> {
    return this.database.transaction("rw", this.table, async () => {
      const current = await this.requireCurrent(id, expectedRevision);
      const changedAt = this.now();
      const next = this.parse({
        ...current,
        revision: current.revision + 1,
        updatedAt: changedAt,
        deletedAt,
      });

      await this.table.put(next);
      return next;
    });
  }

  private async requireCurrent(id: string, expectedRevision: number): Promise<TEntity> {
    const current = await this.table.get(id);

    if (!current) {
      throw new RepositoryError("RECORD_NOT_FOUND", `Der Datensatz ${id} wurde nicht gefunden.`);
    }

    if (current.revision !== expectedRevision) {
      throw new RepositoryError(
        "REVISION_CONFLICT",
        `Revision ${expectedRevision} ist veraltet; aktuell ist Revision ${current.revision}.`,
      );
    }

    return current;
  }

  private parse(value: unknown): TEntity {
    try {
      return this.schema.parse(value);
    } catch (error) {
      throw new RepositoryError("VALIDATION_FAILED", "Der Datensatz ist ungültig.", {
        cause: error,
      });
    }
  }
}

export interface RhiaBrowserStorageOptions {
  databaseName?: string;
  now?: Clock;
}

export type BackupCollection = "areas" | "sources" | "notes" | "auditEntries";

export interface ImportConflict {
  collection: BackupCollection;
  id: string;
}

export interface ImportPreview {
  backup: RhiaBackupPackage;
  conflicts: ImportConflict[];
  recordCounts: RhiaBackupPackage["manifest"]["recordCounts"];
}

export type ImportConflictStrategy = "abort" | "replace";

function sortById<TEntity extends { id: string }>(entities: TEntity[]): TEntity[] {
  return entities.toSorted((left, right) => left.id.localeCompare(right.id));
}

function checksumContent(backup: RhiaBackupPackage): string {
  return JSON.stringify({
    manifest: {
      format: backup.manifest.format,
      formatVersion: backup.manifest.formatVersion,
      schemaVersion: backup.manifest.schemaVersion,
      createdAt: backup.manifest.createdAt,
      checksumAlgorithm: backup.manifest.checksumAlgorithm,
      recordCounts: backup.manifest.recordCounts,
    },
    data: backup.data,
  });
}

async function sha256Hex(content: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new RepositoryError(
      "PERSISTENCE_UNAVAILABLE",
      "Web Crypto ist für eine sichere RHIA-Sicherung nicht verfügbar.",
    );
  }

  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class RhiaBrowserStorage {
  readonly database: RhiaBrowserDatabase;
  readonly areas: EntityRepository<Area>;
  readonly sources: EntityRepository<Source>;
  readonly notes: EntityRepository<Note>;
  readonly auditEntries: EntityRepository<AuditEntry>;
  private readonly now: Clock;

  constructor(options: RhiaBrowserStorageOptions = {}) {
    const now = options.now ?? (() => new Date().toISOString());
    this.now = now;
    this.database = new RhiaBrowserDatabase(options.databaseName);
    this.areas = new DexieEntityRepository<Area>(
      this.database,
      this.database.areas,
      areaSchema,
      now,
    );
    this.sources = new DexieEntityRepository<Source>(
      this.database,
      this.database.sources,
      sourceSchema,
      now,
    );
    this.notes = new DexieEntityRepository<Note>(
      this.database,
      this.database.notes,
      noteSchema,
      now,
    );
    this.auditEntries = new DexieEntityRepository<AuditEntry>(
      this.database,
      this.database.auditEntries,
      auditEntrySchema,
      now,
    );
  }

  async open(): Promise<void> {
    try {
      await this.database.open();
    } catch (error) {
      throw new RepositoryError(
        "PERSISTENCE_UNAVAILABLE",
        "Die lokale RHIA-Datenbank konnte nicht geöffnet werden.",
        { cause: error },
      );
    }
  }

  close(): void {
    this.database.close();
  }

  async deleteDatabase(): Promise<void> {
    this.close();
    await Dexie.delete(this.database.name);
  }

  async transaction<TResult>(operation: (storage: RhiaBrowserStorage) => Promise<TResult>) {
    const mode: TransactionMode = "rw";
    return this.database.transaction(
      mode,
      this.database.areas,
      this.database.sources,
      this.database.notes,
      this.database.auditEntries,
      () => operation(this),
    );
  }

  async createBackup(): Promise<RhiaBackupPackage> {
    const data: RhiaBackupData = {
      areas: sortById(await this.database.areas.toArray()),
      sources: sortById(await this.database.sources.toArray()),
      notes: sortById(await this.database.notes.toArray()),
      auditEntries: sortById(await this.database.auditEntries.toArray()),
    };
    const backup: RhiaBackupPackage = {
      manifest: {
        format: "rhia-backup",
        formatVersion: RHIA_BACKUP_FORMAT_VERSION,
        schemaVersion: RHIA_SCHEMA_VERSION,
        createdAt: this.now(),
        checksumAlgorithm: "SHA-256",
        checksum: "0".repeat(64),
        recordCounts: {
          areas: data.areas.length,
          sources: data.sources.length,
          notes: data.notes.length,
          auditEntries: data.auditEntries.length,
        },
      },
      data,
    };

    backup.manifest.checksum = await sha256Hex(checksumContent(backup));
    return rhiaBackupPackageSchema.parse(backup);
  }

  serializeBackup(backup: RhiaBackupPackage): string {
    return JSON.stringify(backup, null, 2);
  }

  async previewImport(input: string | unknown): Promise<ImportPreview> {
    let raw: unknown = input;
    if (typeof input === "string") {
      try {
        raw = JSON.parse(input);
      } catch (error) {
        throw new RepositoryError("BACKUP_INVALID", "Die Sicherungsdatei ist kein gültiges JSON.", {
          cause: error,
        });
      }
    }

    const result = rhiaBackupPackageSchema.safeParse(raw);
    if (!result.success) {
      throw new RepositoryError(
        "BACKUP_INVALID",
        "Die Sicherungsdatei entspricht nicht dem RHIA-Format.",
        { cause: result.error },
      );
    }

    const expectedChecksum = await sha256Hex(checksumContent(result.data));
    if (expectedChecksum !== result.data.manifest.checksum) {
      throw new RepositoryError(
        "BACKUP_CHECKSUM_MISMATCH",
        "Die Prüfsumme der Sicherungsdatei stimmt nicht.",
      );
    }

    return {
      backup: result.data,
      conflicts: await this.findImportConflicts(result.data.data),
      recordCounts: result.data.manifest.recordCounts,
    };
  }

  async importBackup(
    preview: ImportPreview,
    conflictStrategy: ImportConflictStrategy = "abort",
  ): Promise<void> {
    const verified = await this.previewImport(preview.backup);

    await this.transaction(async () => {
      const currentConflicts = await this.findImportConflicts(verified.backup.data);
      if (currentConflicts.length > 0 && conflictStrategy === "abort") {
        throw new RepositoryError(
          "IMPORT_CONFLICT",
          `Der Import würde ${currentConflicts.length} vorhandene Datensätze überschreiben.`,
        );
      }

      const method = conflictStrategy === "replace" ? "bulkPut" : "bulkAdd";
      await this.database.areas[method](verified.backup.data.areas);
      await this.database.sources[method](verified.backup.data.sources);
      await this.database.notes[method](verified.backup.data.notes);
      await this.database.auditEntries[method](verified.backup.data.auditEntries);
    });
  }

  async purgeExpiredTrash(referenceTime = this.now()): Promise<number> {
    const cutoff = new Date(referenceTime);
    cutoff.setUTCDate(cutoff.getUTCDate() - RHIA_TRASH_RETENTION_DAYS);
    const cutoffTimestamp = cutoff.toISOString();

    return this.transaction(async () => {
      const removed = await Promise.all([
        this.database.areas.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.sources.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.notes.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
      ]);
      return removed.reduce((total, count) => total + count, 0);
    });
  }

  async clearAllData(confirmation: string): Promise<void> {
    if (confirmation !== DELETE_ALL_CONFIRMATION) {
      throw new RepositoryError(
        "CONFIRMATION_REQUIRED",
        `Zur Gesamtlöschung muss „${DELETE_ALL_CONFIRMATION}“ bestätigt werden.`,
      );
    }

    await this.transaction(async () => {
      await Promise.all([
        this.database.areas.clear(),
        this.database.sources.clear(),
        this.database.notes.clear(),
        this.database.auditEntries.clear(),
      ]);
    });
  }

  private async findImportConflicts(data: RhiaBackupData): Promise<ImportConflict[]> {
    const groups = [
      { collection: "areas", table: this.database.areas, records: data.areas },
      { collection: "sources", table: this.database.sources, records: data.sources },
      { collection: "notes", table: this.database.notes, records: data.notes },
      {
        collection: "auditEntries",
        table: this.database.auditEntries,
        records: data.auditEntries,
      },
    ] as const;
    const conflicts: ImportConflict[] = [];

    for (const group of groups) {
      const existing = await group.table.bulkGet(group.records.map((record) => record.id));
      existing.forEach((record, index) => {
        const incoming = group.records[index];
        if (record && incoming) {
          conflicts.push({ collection: group.collection, id: incoming.id });
        }
      });
    }

    return conflicts;
  }
}

export function createRhiaBrowserStorage(
  options: RhiaBrowserStorageOptions = {},
): RhiaBrowserStorage {
  return new RhiaBrowserStorage(options);
}
