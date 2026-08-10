import {
  areaSchema,
  auditEntrySchema,
  briefingSchema,
  decisionSchema,
  goalSchema,
  memoryConflictSchema,
  memoryFactSchema,
  noteSchema,
  planningFeedbackSchema,
  projectSchema,
  type RhiaBackupData,
  type RhiaBackupPackage,
  type RhiaBackupPackageV1,
  type RhiaBackupPackageV2,
  type RhiaBackupPackageV3,
  type RhiaBackupPackageV4,
  rhiaBackupPackageSchema,
  rhiaBackupPackageV4Schema,
  sourceSchema,
  taskDependencySchema,
  taskSchema,
  workBlockSchema,
} from "@rhia/contracts";
import {
  type Area,
  type AuditEntry,
  type Briefing,
  type Decision,
  ENTITY_TYPES,
  type EntityRepository,
  type EntityType,
  type Goal,
  type MemoryConflict,
  type MemoryFact,
  type Note,
  type PlanningFeedback,
  type PersistedEntity,
  type Project,
  RepositoryError,
  type RepositoryReadOptions,
  RHIA_SCHEMA_VERSION,
  type Source,
  type Task,
  type TaskDependency,
  type WorkBlock,
} from "@rhia/domain";
import Dexie, { type Table, type TransactionMode } from "dexie";

export const RHIA_BROWSER_DATABASE_NAME = "rhia-2" as const;
export const RHIA_STAGE_ONE_BROWSER_DATABASE_VERSION = 2 as const;
export const RHIA_STAGE_TWO_BROWSER_DATABASE_VERSION = 3 as const;
export const RHIA_STAGE_THREE_BROWSER_DATABASE_VERSION = 4 as const;
export const RHIA_BROWSER_DATABASE_VERSION = 5 as const;
export const RHIA_BACKUP_FORMAT_VERSION = 4 as const;
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

const STAGE_TWO_STORES = {
  ...CURRENT_STORES,
  memoryFacts:
    "&id, type, areaId, status, conflictKey, updatedAt, deletedAt, revision, [areaId+updatedAt], [conflictKey+status]",
  decisions: "&id, type, areaId, status, updatedAt, deletedAt, revision, [areaId+updatedAt]",
  memoryConflicts:
    "&id, type, areaId, status, conflictKey, detectedAt, updatedAt, deletedAt, revision, [conflictKey+status]",
} as const;

const STAGE_THREE_STORES = {
  ...STAGE_TWO_STORES,
  projects: "&id, type, areaId, status, updatedAt, deletedAt, revision, [areaId+updatedAt]",
  goals:
    "&id, type, projectId, status, targetAt, updatedAt, deletedAt, revision, [projectId+updatedAt]",
  tasks:
    "&id, type, areaId, projectId, goalId, status, dueAt, importance, updatedAt, deletedAt, revision, [areaId+updatedAt], [projectId+updatedAt], [status+dueAt]",
  taskDependencies:
    "&id, type, taskId, dependsOnTaskId, updatedAt, deletedAt, revision, [taskId+dependsOnTaskId]",
} as const;

const STAGE_FOUR_STORES = {
  ...STAGE_THREE_STORES,
  workBlocks:
    "&id, type, briefingId, taskId, areaId, kind, status, startAt, endAt, updatedAt, deletedAt, revision, [briefingId+startAt], [areaId+startAt]",
  briefings:
    "&id, type, kind, status, periodStart, periodEnd, generatedAt, updatedAt, deletedAt, revision, [kind+generatedAt]",
  planningFeedback:
    "&id, type, briefingId, workBlockId, taskId, result, reason, recordedAt, updatedAt, deletedAt, revision, [workBlockId+recordedAt], [taskId+recordedAt]",
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
  memoryFacts!: Table<MemoryFact, string>;
  decisions!: Table<Decision, string>;
  memoryConflicts!: Table<MemoryConflict, string>;
  projects!: Table<Project, string>;
  goals!: Table<Goal, string>;
  tasks!: Table<Task, string>;
  taskDependencies!: Table<TaskDependency, string>;
  workBlocks!: Table<WorkBlock, string>;
  briefings!: Table<Briefing, string>;
  planningFeedback!: Table<PlanningFeedback, string>;

  constructor(databaseName: string = RHIA_BROWSER_DATABASE_NAME) {
    super(databaseName);

    this.version(1).stores(LEGACY_VERSION_ONE_STORES);
    this.version(RHIA_STAGE_ONE_BROWSER_DATABASE_VERSION)
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
    this.version(RHIA_STAGE_TWO_BROWSER_DATABASE_VERSION).stores(STAGE_TWO_STORES);
    this.version(RHIA_STAGE_THREE_BROWSER_DATABASE_VERSION).stores(STAGE_THREE_STORES);
    this.version(RHIA_BROWSER_DATABASE_VERSION).stores(STAGE_FOUR_STORES);
  }
}

interface RepositoryLifecycle<TEntity> {
  softDelete(entity: TEntity, changedAt: string): TEntity;
  restore(entity: TEntity, changedAt: string): TEntity;
}

class DexieEntityRepository<TEntity extends PersistedEntity> implements EntityRepository<TEntity> {
  constructor(
    private readonly database: RhiaBrowserDatabase,
    private readonly table: Table<TEntity, string>,
    private readonly schema: EntitySchema<TEntity>,
    private readonly now: Clock,
    private readonly lifecycle?: RepositoryLifecycle<TEntity>,
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
    return this.changeDeletedAt(id, expectedRevision, true);
  }

  async restore(id: string, expectedRevision: number): Promise<TEntity> {
    return this.changeDeletedAt(id, expectedRevision, false);
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
    deleteRecord: boolean,
  ): Promise<TEntity> {
    return this.database.transaction("rw", this.table, async () => {
      const current = await this.requireCurrent(id, expectedRevision);
      const changedAt = this.now();
      const lifecycleEntity = deleteRecord
        ? this.lifecycle?.softDelete(current, changedAt)
        : this.lifecycle?.restore(current, changedAt);
      const next = this.parse({
        ...current,
        ...lifecycleEntity,
        revision: current.revision + 1,
        updatedAt: changedAt,
        deletedAt: deleteRecord ? changedAt : null,
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

export type BackupCollection =
  | "areas"
  | "sources"
  | "notes"
  | "auditEntries"
  | "memoryFacts"
  | "decisions"
  | "memoryConflicts"
  | "projects"
  | "goals"
  | "tasks"
  | "taskDependencies"
  | "workBlocks"
  | "briefings"
  | "planningFeedback";

export interface ImportConflict {
  collection: BackupCollection;
  id: string;
}

export interface ImportPreview {
  backup: RhiaBackupPackageV4;
  conflicts: ImportConflict[];
  recordCounts: RhiaBackupPackageV4["manifest"]["recordCounts"];
  sourceFormatVersion: 1 | 2 | 3 | 4;
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

function isV1Backup(backup: RhiaBackupPackage): backup is RhiaBackupPackageV1 {
  return backup.manifest.formatVersion === 1;
}

function isV2Backup(backup: RhiaBackupPackage): backup is RhiaBackupPackageV2 {
  return backup.manifest.formatVersion === 2;
}

function isV3Backup(backup: RhiaBackupPackage): backup is RhiaBackupPackageV3 {
  return backup.manifest.formatVersion === 3;
}

async function migrateLegacyBackup(
  backup: RhiaBackupPackageV1 | RhiaBackupPackageV2 | RhiaBackupPackageV3,
): Promise<RhiaBackupPackageV4> {
  const memoryData = isV1Backup(backup)
    ? { memoryFacts: [], decisions: [], memoryConflicts: [] }
    : {
        memoryFacts: backup.data.memoryFacts,
        decisions: backup.data.decisions,
        memoryConflicts: backup.data.memoryConflicts,
      };
  const workHubData =
    isV1Backup(backup) || isV2Backup(backup)
      ? { projects: [], goals: [], tasks: [], taskDependencies: [] }
      : {
          projects: backup.data.projects,
          goals: backup.data.goals,
          tasks: backup.data.tasks,
          taskDependencies: backup.data.taskDependencies,
        };
  const migrated: RhiaBackupPackageV4 = {
    manifest: {
      ...backup.manifest,
      formatVersion: 4,
      checksum: "0".repeat(64),
      recordCounts: {
        ...backup.manifest.recordCounts,
        memoryFacts: memoryData.memoryFacts.length,
        decisions: memoryData.decisions.length,
        memoryConflicts: memoryData.memoryConflicts.length,
        projects: workHubData.projects.length,
        goals: workHubData.goals.length,
        tasks: workHubData.tasks.length,
        taskDependencies: workHubData.taskDependencies.length,
        workBlocks: 0,
        briefings: 0,
        planningFeedback: 0,
      },
    },
    data: {
      ...backup.data,
      ...memoryData,
      ...workHubData,
      workBlocks: [],
      briefings: [],
      planningFeedback: [],
    },
  };
  migrated.manifest.checksum = await sha256Hex(checksumContent(migrated));
  return migrated;
}

export class RhiaBrowserStorage {
  readonly database: RhiaBrowserDatabase;
  readonly areas: EntityRepository<Area>;
  readonly sources: EntityRepository<Source>;
  readonly notes: EntityRepository<Note>;
  readonly auditEntries: EntityRepository<AuditEntry>;
  readonly memoryFacts: EntityRepository<MemoryFact>;
  readonly decisions: EntityRepository<Decision>;
  readonly memoryConflicts: EntityRepository<MemoryConflict>;
  readonly projects: EntityRepository<Project>;
  readonly goals: EntityRepository<Goal>;
  readonly tasks: EntityRepository<Task>;
  readonly taskDependencies: EntityRepository<TaskDependency>;
  readonly workBlocks: EntityRepository<WorkBlock>;
  readonly briefings: EntityRepository<Briefing>;
  readonly planningFeedback: EntityRepository<PlanningFeedback>;
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
    this.memoryFacts = new DexieEntityRepository<MemoryFact>(
      this.database,
      this.database.memoryFacts,
      memoryFactSchema,
      now,
      {
        softDelete: (entity) => ({ ...entity, status: "deleted" }),
        restore: (entity) => ({
          ...entity,
          status: "proposed",
          confirmedAt: null,
          confirmedBy: null,
        }),
      },
    );
    this.decisions = new DexieEntityRepository<Decision>(
      this.database,
      this.database.decisions,
      decisionSchema,
      now,
      {
        softDelete: (entity) => ({ ...entity, status: "deleted" }),
        restore: (entity) => ({
          ...entity,
          status: "proposed",
          confirmedAt: null,
          confirmedBy: null,
        }),
      },
    );
    this.memoryConflicts = new DexieEntityRepository<MemoryConflict>(
      this.database,
      this.database.memoryConflicts,
      memoryConflictSchema,
      now,
    );
    this.projects = new DexieEntityRepository<Project>(
      this.database,
      this.database.projects,
      projectSchema,
      now,
    );
    this.goals = new DexieEntityRepository<Goal>(
      this.database,
      this.database.goals,
      goalSchema,
      now,
    );
    this.tasks = new DexieEntityRepository<Task>(
      this.database,
      this.database.tasks,
      taskSchema,
      now,
    );
    this.taskDependencies = new DexieEntityRepository<TaskDependency>(
      this.database,
      this.database.taskDependencies,
      taskDependencySchema,
      now,
    );
    this.workBlocks = new DexieEntityRepository<WorkBlock>(
      this.database,
      this.database.workBlocks,
      workBlockSchema,
      now,
    );
    this.briefings = new DexieEntityRepository<Briefing>(
      this.database,
      this.database.briefings,
      briefingSchema,
      now,
    );
    this.planningFeedback = new DexieEntityRepository<PlanningFeedback>(
      this.database,
      this.database.planningFeedback,
      planningFeedbackSchema,
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
      [
        this.database.areas,
        this.database.sources,
        this.database.notes,
        this.database.auditEntries,
        this.database.memoryFacts,
        this.database.decisions,
        this.database.memoryConflicts,
        this.database.projects,
        this.database.goals,
        this.database.tasks,
        this.database.taskDependencies,
        this.database.workBlocks,
        this.database.briefings,
        this.database.planningFeedback,
      ],
      () => operation(this),
    );
  }

  async createBackup(): Promise<RhiaBackupPackageV4> {
    const data: RhiaBackupData = {
      areas: sortById(await this.database.areas.toArray()),
      sources: sortById(await this.database.sources.toArray()),
      notes: sortById(await this.database.notes.toArray()),
      auditEntries: sortById(await this.database.auditEntries.toArray()),
      memoryFacts: sortById(await this.database.memoryFacts.toArray()),
      decisions: sortById(await this.database.decisions.toArray()),
      memoryConflicts: sortById(await this.database.memoryConflicts.toArray()),
      projects: sortById(await this.database.projects.toArray()),
      goals: sortById(await this.database.goals.toArray()),
      tasks: sortById(await this.database.tasks.toArray()),
      taskDependencies: sortById(await this.database.taskDependencies.toArray()),
      workBlocks: sortById(await this.database.workBlocks.toArray()),
      briefings: sortById(await this.database.briefings.toArray()),
      planningFeedback: sortById(await this.database.planningFeedback.toArray()),
    };
    const backup: RhiaBackupPackageV4 = {
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
          memoryFacts: data.memoryFacts.length,
          decisions: data.decisions.length,
          memoryConflicts: data.memoryConflicts.length,
          projects: data.projects.length,
          goals: data.goals.length,
          tasks: data.tasks.length,
          taskDependencies: data.taskDependencies.length,
          workBlocks: data.workBlocks.length,
          briefings: data.briefings.length,
          planningFeedback: data.planningFeedback.length,
        },
      },
      data,
    };

    backup.manifest.checksum = await sha256Hex(checksumContent(backup));
    return rhiaBackupPackageV4Schema.parse(backup);
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

    const sourceBackup = result.data;
    const expectedChecksum = await sha256Hex(checksumContent(sourceBackup));
    if (expectedChecksum !== sourceBackup.manifest.checksum) {
      throw new RepositoryError(
        "BACKUP_CHECKSUM_MISMATCH",
        "Die Prüfsumme der Sicherungsdatei stimmt nicht.",
      );
    }

    const backup =
      isV1Backup(sourceBackup) || isV2Backup(sourceBackup) || isV3Backup(sourceBackup)
        ? await migrateLegacyBackup(sourceBackup)
        : sourceBackup;

    return {
      backup,
      conflicts: await this.findImportConflicts(backup.data),
      recordCounts: backup.manifest.recordCounts,
      sourceFormatVersion: sourceBackup.manifest.formatVersion,
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

      if (conflictStrategy === "replace") {
        await this.database.areas.bulkPut(verified.backup.data.areas);
        await this.database.sources.bulkPut(verified.backup.data.sources);
        await this.database.notes.bulkPut(verified.backup.data.notes);
        await this.database.auditEntries.bulkPut(verified.backup.data.auditEntries);
        await this.database.memoryFacts.bulkPut(verified.backup.data.memoryFacts);
        await this.database.decisions.bulkPut(verified.backup.data.decisions);
        await this.database.memoryConflicts.bulkPut(verified.backup.data.memoryConflicts);
        await this.database.projects.bulkPut(verified.backup.data.projects);
        await this.database.goals.bulkPut(verified.backup.data.goals);
        await this.database.tasks.bulkPut(verified.backup.data.tasks);
        await this.database.taskDependencies.bulkPut(verified.backup.data.taskDependencies);
        await this.database.workBlocks.bulkPut(verified.backup.data.workBlocks);
        await this.database.briefings.bulkPut(verified.backup.data.briefings);
        await this.database.planningFeedback.bulkPut(verified.backup.data.planningFeedback);
      } else {
        await this.database.areas.bulkAdd(verified.backup.data.areas);
        await this.database.sources.bulkAdd(verified.backup.data.sources);
        await this.database.notes.bulkAdd(verified.backup.data.notes);
        await this.database.auditEntries.bulkAdd(verified.backup.data.auditEntries);
        await this.database.memoryFacts.bulkAdd(verified.backup.data.memoryFacts);
        await this.database.decisions.bulkAdd(verified.backup.data.decisions);
        await this.database.memoryConflicts.bulkAdd(verified.backup.data.memoryConflicts);
        await this.database.projects.bulkAdd(verified.backup.data.projects);
        await this.database.goals.bulkAdd(verified.backup.data.goals);
        await this.database.tasks.bulkAdd(verified.backup.data.tasks);
        await this.database.taskDependencies.bulkAdd(verified.backup.data.taskDependencies);
        await this.database.workBlocks.bulkAdd(verified.backup.data.workBlocks);
        await this.database.briefings.bulkAdd(verified.backup.data.briefings);
        await this.database.planningFeedback.bulkAdd(verified.backup.data.planningFeedback);
      }
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
        this.database.memoryFacts.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.decisions.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.memoryConflicts.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.projects.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.goals.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.tasks.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.taskDependencies.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.workBlocks.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.briefings.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
        this.database.planningFeedback.where("deletedAt").belowOrEqual(cutoffTimestamp).delete(),
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
        this.database.memoryFacts.clear(),
        this.database.decisions.clear(),
        this.database.memoryConflicts.clear(),
        this.database.projects.clear(),
        this.database.goals.clear(),
        this.database.tasks.clear(),
        this.database.taskDependencies.clear(),
        this.database.workBlocks.clear(),
        this.database.briefings.clear(),
        this.database.planningFeedback.clear(),
      ]);
    });
  }

  private async findImportConflicts(data: RhiaBackupData): Promise<ImportConflict[]> {
    type IdentifiedRecord = { id: string };
    const groups: Array<{
      collection: BackupCollection;
      table: Table<IdentifiedRecord, string>;
      records: IdentifiedRecord[];
    }> = [
      {
        collection: "areas",
        table: this.database.areas as unknown as Table<IdentifiedRecord, string>,
        records: data.areas,
      },
      {
        collection: "sources",
        table: this.database.sources as unknown as Table<IdentifiedRecord, string>,
        records: data.sources,
      },
      {
        collection: "notes",
        table: this.database.notes as unknown as Table<IdentifiedRecord, string>,
        records: data.notes,
      },
      {
        collection: "auditEntries",
        table: this.database.auditEntries as unknown as Table<IdentifiedRecord, string>,
        records: data.auditEntries,
      },
      {
        collection: "memoryFacts",
        table: this.database.memoryFacts as unknown as Table<IdentifiedRecord, string>,
        records: data.memoryFacts,
      },
      {
        collection: "decisions",
        table: this.database.decisions as unknown as Table<IdentifiedRecord, string>,
        records: data.decisions,
      },
      {
        collection: "memoryConflicts",
        table: this.database.memoryConflicts as unknown as Table<IdentifiedRecord, string>,
        records: data.memoryConflicts,
      },
      {
        collection: "projects",
        table: this.database.projects as unknown as Table<IdentifiedRecord, string>,
        records: data.projects,
      },
      {
        collection: "goals",
        table: this.database.goals as unknown as Table<IdentifiedRecord, string>,
        records: data.goals,
      },
      {
        collection: "tasks",
        table: this.database.tasks as unknown as Table<IdentifiedRecord, string>,
        records: data.tasks,
      },
      {
        collection: "taskDependencies",
        table: this.database.taskDependencies as unknown as Table<IdentifiedRecord, string>,
        records: data.taskDependencies,
      },
      {
        collection: "workBlocks",
        table: this.database.workBlocks as unknown as Table<IdentifiedRecord, string>,
        records: data.workBlocks,
      },
      {
        collection: "briefings",
        table: this.database.briefings as unknown as Table<IdentifiedRecord, string>,
        records: data.briefings,
      },
      {
        collection: "planningFeedback",
        table: this.database.planningFeedback as unknown as Table<IdentifiedRecord, string>,
        records: data.planningFeedback,
      },
    ];
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
