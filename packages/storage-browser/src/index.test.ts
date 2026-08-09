import "fake-indexeddb/auto";
import {
  areaSchema,
  auditEntrySchema,
  goalSchema,
  noteSchema,
  projectSchema,
  type RhiaBackupPackageV1,
  type RhiaBackupPackageV2,
  rhiaBackupPackageV1Schema,
  rhiaBackupPackageV2Schema,
  sourceSchema,
  taskDependencySchema,
  taskSchema,
} from "@rhia/contracts";
import {
  createArea,
  createAuditEntry,
  createDecision,
  createGoal,
  createMemoryConflict,
  createMemoryFact,
  createNote,
  createProject,
  createSource,
  createTask,
  createTaskDependency,
} from "@rhia/domain";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createRhiaBrowserStorage,
  DELETE_ALL_CONFIRMATION,
  RHIA_BROWSER_DATABASE_VERSION,
  RHIA_STAGE_ONE_BROWSER_DATABASE_VERSION,
  RHIA_STAGE_TWO_BROWSER_DATABASE_VERSION,
  type RhiaBrowserStorage,
} from "./index";

const timestamp = "2026-08-08T16:00:00.000Z";
const changedAt = "2026-08-08T16:05:00.000Z";
const ids = {
  area: "11111111-1111-4111-8111-111111111111",
  source: "22222222-2222-4222-8222-222222222222",
  note: "33333333-3333-4333-8333-333333333333",
  audit: "44444444-4444-4444-8444-444444444444",
  factOne: "55555555-5555-4555-8555-555555555555",
  factTwo: "66666666-6666-4666-8666-666666666666",
  decision: "77777777-7777-4777-8777-777777777777",
  conflict: "88888888-8888-4888-8888-888888888888",
  device: "99999999-9999-4999-8999-999999999999",
  project: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  goal: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  taskOne: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  taskTwo: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  dependency: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
} as const;

let storage: RhiaBrowserStorage;

beforeEach(async () => {
  storage = createRhiaBrowserStorage({
    databaseName: `rhia-test-${crypto.randomUUID()}`,
    now: () => changedAt,
  });
  await storage.open();
});

afterEach(async () => {
  await storage.deleteDatabase();
});

function createTestRecords() {
  const area = createArea({ name: "RHIA" }, { id: ids.area, timestamp });
  const source = createSource(
    { kind: "manual", label: "Direkte Eingabe" },
    { id: ids.source, timestamp },
  );
  const note = createNote(
    { areaId: area.id, sourceId: source.id, title: "Test", body: "Künstliche Daten" },
    { id: ids.note, timestamp },
  );
  const audit = createAuditEntry(
    { entityType: note.type, entityId: note.id, entityRevision: 1, action: "create" },
    { id: ids.audit, timestamp },
  );
  return { area, source, note, audit };
}

function createTestMemoryRecords() {
  const factOne = createMemoryFact(
    {
      areaId: ids.area,
      sourceIds: [ids.source],
      knowledgeType: "profile",
      subject: "sir",
      predicate: "preferred-address",
      value: "Sir",
      conflictKey: "sir.profile.preferred-address",
      displayText: "Die bevorzugte Anrede ist Sir.",
    },
    { id: ids.factOne, timestamp, originDeviceId: ids.device },
  );
  const factTwo = createMemoryFact(
    {
      areaId: ids.area,
      sourceIds: [ids.source],
      knowledgeType: "profile",
      subject: "sir",
      predicate: "preferred-address",
      value: "Mike",
      conflictKey: factOne.conflictKey,
      displayText: "Die bevorzugte Anrede ist Mike.",
    },
    { id: ids.factTwo, timestamp, originDeviceId: ids.device },
  );
  const decision = createDecision(
    {
      areaId: ids.area,
      sourceIds: [ids.source],
      title: "OpenAI deaktiviert lassen",
      decisionText: "OpenAI bleibt in Stufe 2 deaktiviert.",
      rationale: "Das Gedächtnis arbeitet vollständig lokal.",
    },
    { id: ids.decision, timestamp, originDeviceId: ids.device },
  );
  const conflict = createMemoryConflict(
    {
      areaId: ids.area,
      conflictKey: factOne.conflictKey,
      factIds: [factOne.id, factTwo.id],
    },
    { id: ids.conflict, timestamp, originDeviceId: ids.device },
  );

  return { factOne, factTwo, decision, conflict };
}

function createTestWorkHubRecords() {
  const project = createProject(
    { areaId: ids.area, title: "RHIA 2.0" },
    { id: ids.project, timestamp },
  );
  const goal = createGoal(
    { projectId: project.id, title: "Arbeitszentrale" },
    { id: ids.goal, timestamp },
  );
  const taskOne = createTask(
    {
      areaId: ids.area,
      projectId: project.id,
      goalId: goal.id,
      title: "Speicher erweitern",
      status: "in-progress",
      importance: "high",
    },
    { id: ids.taskOne, timestamp },
  );
  const taskTwo = createTask(
    { areaId: ids.area, projectId: project.id, title: "Import prüfen", status: "planned" },
    { id: ids.taskTwo, timestamp },
  );
  const dependency = createTaskDependency(
    { taskId: taskTwo.id, dependsOnTaskId: taskOne.id },
    { id: ids.dependency, timestamp },
  );
  return { project, goal, taskOne, taskTwo, dependency };
}

async function signV1Backup(backup: RhiaBackupPackageV1): Promise<RhiaBackupPackageV1> {
  const normalized = rhiaBackupPackageV1Schema.parse(backup);
  const checksumContent = JSON.stringify({
    manifest: {
      format: normalized.manifest.format,
      formatVersion: normalized.manifest.formatVersion,
      schemaVersion: normalized.manifest.schemaVersion,
      createdAt: normalized.manifest.createdAt,
      checksumAlgorithm: normalized.manifest.checksumAlgorithm,
      recordCounts: normalized.manifest.recordCounts,
    },
    data: normalized.data,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(checksumContent));
  const checksum = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return { ...normalized, manifest: { ...normalized.manifest, checksum } };
}

async function signV2Backup(backup: RhiaBackupPackageV2): Promise<RhiaBackupPackageV2> {
  const normalized = rhiaBackupPackageV2Schema.parse(backup);
  const checksumContent = JSON.stringify({
    manifest: {
      format: normalized.manifest.format,
      formatVersion: normalized.manifest.formatVersion,
      schemaVersion: normalized.manifest.schemaVersion,
      createdAt: normalized.manifest.createdAt,
      checksumAlgorithm: normalized.manifest.checksumAlgorithm,
      recordCounts: normalized.manifest.recordCounts,
    },
    data: normalized.data,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(checksumContent));
  const checksum = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return { ...normalized, manifest: { ...normalized.manifest, checksum } };
}

describe("Dexie repositories", () => {
  it("stores and reads all four stage 1 entity types", async () => {
    const { area, source, note, audit } = createTestRecords();

    await storage.transaction(async (repositories) => {
      await repositories.areas.create(area);
      await repositories.sources.create(source);
      await repositories.notes.create(note);
      await repositories.auditEntries.create(audit);
    });

    await expect(storage.areas.getById(area.id)).resolves.toEqual(area);
    await expect(storage.sources.list()).resolves.toEqual([source]);
    await expect(storage.notes.getById(note.id)).resolves.toEqual(note);
    await expect(storage.auditEntries.list()).resolves.toEqual([audit]);
  });

  it("stores and reads all three stage 2 memory entity types", async () => {
    const { factOne, factTwo, decision, conflict } = createTestMemoryRecords();

    await storage.transaction(async (repositories) => {
      await repositories.memoryFacts.create(factOne);
      await repositories.memoryFacts.create(factTwo);
      await repositories.decisions.create(decision);
      await repositories.memoryConflicts.create(conflict);
    });

    const memoryFacts = await storage.memoryFacts.list();
    expect(memoryFacts).toHaveLength(2);
    expect(memoryFacts).toEqual(expect.arrayContaining([factOne, factTwo]));
    await expect(storage.decisions.getById(decision.id)).resolves.toEqual(decision);
    await expect(storage.memoryConflicts.getById(conflict.id)).resolves.toEqual(conflict);
  });

  it("stores, updates, deletes and restores all stage 3 work hub entity types", async () => {
    const { project, goal, taskOne, taskTwo, dependency } = createTestWorkHubRecords();

    await storage.transaction(async (repositories) => {
      await repositories.projects.create(project);
      await repositories.goals.create(goal);
      await repositories.tasks.create(taskOne);
      await repositories.tasks.create(taskTwo);
      await repositories.taskDependencies.create(dependency);
    });

    expect(projectSchema.parse(await storage.projects.getById(project.id))).toEqual(project);
    expect(goalSchema.parse(await storage.goals.getById(goal.id))).toEqual(goal);
    expect(taskSchema.parse(await storage.tasks.getById(taskOne.id))).toEqual(taskOne);
    expect(
      taskDependencySchema.parse(await storage.taskDependencies.getById(dependency.id)),
    ).toEqual(dependency);

    const updated = await storage.tasks.replace({ ...taskOne, title: "Speicher geprüft" }, 1);
    expect(updated).toMatchObject({ title: "Speicher geprüft", revision: 2 });
    const deleted = await storage.tasks.softDelete(taskTwo.id, 1);
    expect(deleted).toMatchObject({ revision: 2, deletedAt: changedAt });
    await expect(storage.tasks.getById(taskTwo.id)).resolves.toBeUndefined();
    await expect(storage.tasks.restore(taskTwo.id, 2)).resolves.toMatchObject({
      revision: 3,
      deletedAt: null,
    });
  });

  it("updates, deletes and safely restores memory records", async () => {
    const { factOne, conflict } = createTestMemoryRecords();
    await storage.memoryFacts.create(factOne);
    await storage.memoryConflicts.create(conflict);

    const updated = await storage.memoryFacts.replace(
      { ...factOne, displayText: "Sir ist die bestätigte Anrede." },
      1,
    );
    expect(updated).toMatchObject({ revision: 2, updatedAt: changedAt });

    const deleted = await storage.memoryFacts.softDelete(factOne.id, 2);
    expect(deleted).toMatchObject({ revision: 3, status: "deleted", deletedAt: changedAt });
    await expect(storage.memoryFacts.getById(factOne.id)).resolves.toBeUndefined();

    const restored = await storage.memoryFacts.restore(factOne.id, 3);
    expect(restored).toMatchObject({
      revision: 4,
      status: "proposed",
      confirmedAt: null,
      confirmedBy: null,
      deletedAt: null,
    });

    await storage.memoryConflicts.hardDelete(conflict.id, 1);
    await expect(storage.memoryConflicts.getById(conflict.id)).resolves.toBeUndefined();
  });

  it("rolls back stage 1 and memory records in one transaction", async () => {
    const { area } = createTestRecords();
    const { factOne, decision } = createTestMemoryRecords();

    await expect(
      storage.transaction(async (repositories) => {
        await repositories.areas.create(area);
        await repositories.memoryFacts.create(factOne);
        await repositories.decisions.create(decision);
        throw new Error("Künstlicher Gedächtnis-Transaktionsfehler");
      }),
    ).rejects.toThrow("Künstlicher Gedächtnis-Transaktionsfehler");

    await expect(storage.areas.list()).resolves.toEqual([]);
    await expect(storage.memoryFacts.list()).resolves.toEqual([]);
    await expect(storage.decisions.list()).resolves.toEqual([]);
  });

  it("increments revisions and rejects stale updates", async () => {
    const { area } = createTestRecords();
    await storage.areas.create(area);

    const updated = await storage.areas.replace({ ...area, name: "RH Produktion" }, 1);

    expect(updated).toMatchObject({
      name: "RH Produktion",
      revision: 2,
      createdAt: timestamp,
      updatedAt: changedAt,
    });
    await expect(storage.areas.replace({ ...updated, name: "Veraltet" }, 1)).rejects.toMatchObject({
      code: "REVISION_CONFLICT",
    });
  });

  it("supports soft-delete, hidden reads, restore and checked hard-delete", async () => {
    const { note } = createTestRecords();
    await storage.notes.create(note);

    const deleted = await storage.notes.softDelete(note.id, 1);
    await expect(storage.notes.getById(note.id)).resolves.toBeUndefined();
    await expect(storage.notes.getById(note.id, { includeDeleted: true })).resolves.toEqual(
      deleted,
    );

    const restored = await storage.notes.restore(note.id, 2);
    expect(restored).toMatchObject({ revision: 3, deletedAt: null });

    await storage.notes.hardDelete(note.id, 3);
    await expect(storage.notes.getById(note.id, { includeDeleted: true })).resolves.toBeUndefined();
  });

  it("rolls back all records when a cross-table transaction fails", async () => {
    const { area, source } = createTestRecords();

    await expect(
      storage.transaction(async (repositories) => {
        await repositories.areas.create(area);
        await repositories.sources.create(source);
        throw new Error("Künstlicher Transaktionsfehler");
      }),
    ).rejects.toThrow("Künstlicher Transaktionsfehler");

    await expect(storage.areas.list()).resolves.toEqual([]);
    await expect(storage.sources.list()).resolves.toEqual([]);
  });

  it("keeps data after the database is closed and reopened", async () => {
    const { area } = createTestRecords();
    const databaseName = storage.database.name;
    await storage.areas.create(area);
    storage.close();

    storage = createRhiaBrowserStorage({ databaseName, now: () => changedAt });
    await storage.open();

    await expect(storage.areas.getById(area.id)).resolves.toEqual(area);
  });

  it("migrates artificial version 1 records without losing them", async () => {
    const databaseName = storage.database.name;
    await storage.deleteDatabase();

    const legacy = new Dexie(databaseName);
    legacy.version(1).stores({
      areas: "&id, name",
      sources: "&id, label",
      notes: "&id, areaId",
      auditEntries: "&id, entityId",
    });
    await legacy.open();
    await legacy.table("areas").add({ id: ids.area, name: "RHIA" });
    await legacy.table("sources").add({ id: ids.source, label: "Altimport" });
    await legacy.table("notes").add({ id: ids.note, areaId: ids.area, body: "Altbestand" });
    await legacy.table("auditEntries").add({ id: ids.audit, entityId: ids.note });
    legacy.close();

    storage = createRhiaBrowserStorage({ databaseName, now: () => changedAt });
    await storage.open();

    expect(storage.database.verno).toBe(RHIA_BROWSER_DATABASE_VERSION);
    expect(areaSchema.safeParse(await storage.areas.getById(ids.area)).success).toBe(true);
    expect(sourceSchema.safeParse(await storage.sources.getById(ids.source)).success).toBe(true);
    expect(noteSchema.safeParse(await storage.notes.getById(ids.note)).success).toBe(true);
    expect(auditEntrySchema.safeParse(await storage.auditEntries.getById(ids.audit)).success).toBe(
      true,
    );
  });

  it("migrates the complete stage 1 schema to memory storage without data loss", async () => {
    const databaseName = storage.database.name;
    const { area, source, note, audit } = createTestRecords();
    await storage.deleteDatabase();

    const stageOne = new Dexie(databaseName);
    stageOne.version(RHIA_STAGE_ONE_BROWSER_DATABASE_VERSION).stores({
      areas: "&id, type, name, status, updatedAt, deletedAt, revision",
      sources: "&id, type, kind, label, updatedAt, deletedAt, revision",
      notes:
        "&id, type, areaId, sourceId, status, updatedAt, deletedAt, revision, [areaId+updatedAt]",
      auditEntries:
        "&id, type, entityType, entityId, action, occurredAt, updatedAt, [entityType+entityId]",
    });
    await stageOne.open();
    await stageOne.table("areas").add(area);
    await stageOne.table("sources").add(source);
    await stageOne.table("notes").add(note);
    await stageOne.table("auditEntries").add(audit);
    stageOne.close();

    storage = createRhiaBrowserStorage({ databaseName, now: () => changedAt });
    await storage.open();

    expect(storage.database.verno).toBe(RHIA_BROWSER_DATABASE_VERSION);
    await expect(storage.areas.getById(area.id)).resolves.toEqual(area);
    await expect(storage.sources.getById(source.id)).resolves.toEqual(source);
    await expect(storage.notes.getById(note.id)).resolves.toEqual(note);
    await expect(storage.auditEntries.getById(audit.id)).resolves.toEqual(audit);
    await expect(storage.memoryFacts.list()).resolves.toEqual([]);
    await expect(storage.decisions.list()).resolves.toEqual([]);
    await expect(storage.memoryConflicts.list()).resolves.toEqual([]);
    await expect(storage.projects.list()).resolves.toEqual([]);
    await expect(storage.goals.list()).resolves.toEqual([]);
    await expect(storage.tasks.list()).resolves.toEqual([]);
    await expect(storage.taskDependencies.list()).resolves.toEqual([]);
  });

  it("migrates the complete stage 2 database to stage 3 without data loss", async () => {
    const databaseName = storage.database.name;
    const { area, source, note, audit } = createTestRecords();
    const { factOne, decision, conflict } = createTestMemoryRecords();
    await storage.deleteDatabase();

    const stageTwo = new Dexie(databaseName);
    stageTwo.version(RHIA_STAGE_TWO_BROWSER_DATABASE_VERSION).stores({
      areas: "&id, type, name, status, updatedAt, deletedAt, revision",
      sources: "&id, type, kind, label, updatedAt, deletedAt, revision",
      notes:
        "&id, type, areaId, sourceId, status, updatedAt, deletedAt, revision, [areaId+updatedAt]",
      auditEntries:
        "&id, type, entityType, entityId, action, occurredAt, updatedAt, [entityType+entityId]",
      memoryFacts:
        "&id, type, areaId, status, conflictKey, updatedAt, deletedAt, revision, [areaId+updatedAt], [conflictKey+status]",
      decisions: "&id, type, areaId, status, updatedAt, deletedAt, revision, [areaId+updatedAt]",
      memoryConflicts:
        "&id, type, areaId, status, conflictKey, detectedAt, updatedAt, deletedAt, revision, [conflictKey+status]",
    });
    await stageTwo.open();
    await stageTwo.table("areas").add(area);
    await stageTwo.table("sources").add(source);
    await stageTwo.table("notes").add(note);
    await stageTwo.table("auditEntries").add(audit);
    await stageTwo.table("memoryFacts").add(factOne);
    await stageTwo.table("decisions").add(decision);
    await stageTwo.table("memoryConflicts").add(conflict);
    stageTwo.close();

    storage = createRhiaBrowserStorage({ databaseName, now: () => changedAt });
    await storage.open();

    expect(storage.database.verno).toBe(RHIA_BROWSER_DATABASE_VERSION);
    await expect(storage.notes.getById(note.id)).resolves.toEqual(note);
    await expect(storage.memoryFacts.getById(factOne.id)).resolves.toEqual(factOne);
    await expect(storage.decisions.getById(decision.id)).resolves.toEqual(decision);
    await expect(storage.memoryConflicts.getById(conflict.id)).resolves.toEqual(conflict);
    await expect(storage.projects.list()).resolves.toEqual([]);
    await expect(storage.goals.list()).resolves.toEqual([]);
    await expect(storage.tasks.list()).resolves.toEqual([]);
    await expect(storage.taskDependencies.list()).resolves.toEqual([]);
  });

  it("exports, verifies and restores a complete v3 backup", async () => {
    const { area, source, note, audit } = createTestRecords();
    const { factOne, factTwo, decision, conflict } = createTestMemoryRecords();
    const { project, goal, taskOne, taskTwo, dependency } = createTestWorkHubRecords();
    await storage.transaction(async (repositories) => {
      await repositories.areas.create(area);
      await repositories.sources.create(source);
      await repositories.notes.create(note);
      await repositories.auditEntries.create(audit);
      await repositories.memoryFacts.create(factOne);
      await repositories.memoryFacts.create(factTwo);
      await repositories.decisions.create(decision);
      await repositories.memoryConflicts.create(conflict);
      await repositories.projects.create(project);
      await repositories.goals.create(goal);
      await repositories.tasks.create(taskOne);
      await repositories.tasks.create(taskTwo);
      await repositories.taskDependencies.create(dependency);
    });

    const backup = await storage.createBackup();
    const serialized = storage.serializeBackup(backup);
    await storage.clearAllData(DELETE_ALL_CONFIRMATION);

    const preview = await storage.previewImport(serialized);
    expect(preview.sourceFormatVersion).toBe(3);
    expect(preview.recordCounts).toEqual({
      areas: 1,
      sources: 1,
      notes: 1,
      auditEntries: 1,
      memoryFacts: 2,
      decisions: 1,
      memoryConflicts: 1,
      projects: 1,
      goals: 1,
      tasks: 2,
      taskDependencies: 1,
    });
    expect(preview.conflicts).toEqual([]);

    await storage.importBackup(preview);
    await expect(storage.notes.getById(note.id)).resolves.toEqual(note);
    await expect(storage.memoryFacts.getById(factOne.id)).resolves.toEqual(factOne);
    await expect(storage.decisions.getById(decision.id)).resolves.toEqual(decision);
    await expect(storage.memoryConflicts.getById(conflict.id)).resolves.toEqual(conflict);
    await expect(storage.projects.getById(project.id)).resolves.toEqual(project);
    await expect(storage.goals.getById(goal.id)).resolves.toEqual(goal);
    await expect(storage.tasks.getById(taskOne.id)).resolves.toEqual(taskOne);
    await expect(storage.taskDependencies.getById(dependency.id)).resolves.toEqual(dependency);
  });

  it("migrates a verified v1 backup to v3 without inventing later-stage records", async () => {
    const { area, source, note, audit } = createTestRecords();
    const v1Backup = await signV1Backup({
      manifest: {
        format: "rhia-backup",
        formatVersion: 1,
        schemaVersion: 1,
        createdAt: timestamp,
        checksumAlgorithm: "SHA-256",
        checksum: "0".repeat(64),
        recordCounts: { areas: 1, sources: 1, notes: 1, auditEntries: 1 },
      },
      data: { areas: [area], sources: [source], notes: [note], auditEntries: [audit] },
    });

    const preview = await storage.previewImport(v1Backup);

    expect(preview.sourceFormatVersion).toBe(1);
    expect(preview.backup.manifest.formatVersion).toBe(3);
    expect(preview.recordCounts).toMatchObject({
      areas: 1,
      sources: 1,
      notes: 1,
      auditEntries: 1,
      memoryFacts: 0,
      decisions: 0,
      memoryConflicts: 0,
      projects: 0,
      goals: 0,
      tasks: 0,
      taskDependencies: 0,
    });
    await storage.importBackup(preview);
    await expect(storage.notes.getById(note.id)).resolves.toEqual(note);
    await expect(storage.memoryFacts.list({ includeDeleted: true })).resolves.toEqual([]);
    await expect(storage.tasks.list({ includeDeleted: true })).resolves.toEqual([]);
  });

  it("migrates a verified v2 backup to v3 while preserving all memory records", async () => {
    const { area, source, note, audit } = createTestRecords();
    const { factOne, decision, conflict } = createTestMemoryRecords();
    const v2Backup = await signV2Backup({
      manifest: {
        format: "rhia-backup",
        formatVersion: 2,
        schemaVersion: 1,
        createdAt: timestamp,
        checksumAlgorithm: "SHA-256",
        checksum: "0".repeat(64),
        recordCounts: {
          areas: 1,
          sources: 1,
          notes: 1,
          auditEntries: 1,
          memoryFacts: 1,
          decisions: 1,
          memoryConflicts: 1,
        },
      },
      data: {
        areas: [area],
        sources: [source],
        notes: [note],
        auditEntries: [audit],
        memoryFacts: [factOne],
        decisions: [decision],
        memoryConflicts: [conflict],
      },
    });

    const preview = await storage.previewImport(v2Backup);

    expect(preview.sourceFormatVersion).toBe(2);
    expect(preview.backup.manifest.formatVersion).toBe(3);
    expect(preview.recordCounts).toMatchObject({
      memoryFacts: 1,
      decisions: 1,
      memoryConflicts: 1,
      projects: 0,
      goals: 0,
      tasks: 0,
      taskDependencies: 0,
    });
    await storage.importBackup(preview);
    await expect(storage.memoryFacts.getById(factOne.id)).resolves.toEqual(factOne);
    await expect(storage.decisions.getById(decision.id)).resolves.toEqual(decision);
    await expect(storage.memoryConflicts.getById(conflict.id)).resolves.toEqual(conflict);
  });

  it("rejects changed backup content and reports existing-record conflicts", async () => {
    const { area, source } = createTestRecords();
    const { factOne } = createTestMemoryRecords();
    await storage.areas.create(area);
    await storage.sources.create(source);
    await storage.memoryFacts.create(factOne);
    const backup = await storage.createBackup();

    const conflictPreview = await storage.previewImport(backup);
    expect(conflictPreview.conflicts).toEqual([
      { collection: "areas", id: area.id },
      { collection: "sources", id: source.id },
      { collection: "memoryFacts", id: factOne.id },
    ]);
    await expect(storage.importBackup(conflictPreview)).rejects.toMatchObject({
      code: "IMPORT_CONFLICT",
    });

    const changedBackup = structuredClone(backup);
    changedBackup.data.memoryFacts[0] = { ...factOne, value: "Manipuliert" };
    await expect(storage.previewImport(changedBackup)).rejects.toMatchObject({
      code: "BACKUP_CHECKSUM_MISMATCH",
    });
  });

  it("revalidates a task import preview immediately before writing", async () => {
    const { area } = createTestRecords();
    const { project, goal, taskOne } = createTestWorkHubRecords();
    await storage.areas.create(area);
    await storage.projects.create(project);
    await storage.goals.create(goal);
    await storage.tasks.create(taskOne);
    const backup = await storage.createBackup();
    await storage.clearAllData(DELETE_ALL_CONFIRMATION);
    const preview = await storage.previewImport(backup);
    preview.backup.data.tasks[0] = { ...taskOne, title: "Nach Prüfung manipuliert" };

    await expect(storage.importBackup(preview)).rejects.toMatchObject({
      code: "BACKUP_CHECKSUM_MISMATCH",
    });
    await expect(storage.tasks.list({ includeDeleted: true })).resolves.toEqual([]);
  });

  it("purges only expired trash and requires explicit confirmation for total deletion", async () => {
    const { area, source } = createTestRecords();
    await storage.areas.create(area);
    await storage.sources.create(source);
    await storage.areas.softDelete(area.id, 1);

    await expect(storage.clearAllData("löschen")).rejects.toMatchObject({
      code: "CONFIRMATION_REQUIRED",
    });
    await expect(storage.purgeExpiredTrash("2026-08-20T16:05:00.000Z")).resolves.toBe(0);
    await expect(storage.purgeExpiredTrash("2026-09-20T16:05:00.000Z")).resolves.toBe(1);
    await expect(storage.sources.getById(source.id)).resolves.toEqual(source);

    await storage.clearAllData(DELETE_ALL_CONFIRMATION);
    await expect(storage.sources.list({ includeDeleted: true })).resolves.toEqual([]);
  });
});
