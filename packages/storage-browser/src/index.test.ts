import "fake-indexeddb/auto";
import { areaSchema, auditEntrySchema, noteSchema, sourceSchema } from "@rhia/contracts";
import { createArea, createAuditEntry, createNote, createSource } from "@rhia/domain";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DELETE_ALL_CONFIRMATION,
  RHIA_BROWSER_DATABASE_VERSION,
  type RhiaBrowserStorage,
  createRhiaBrowserStorage,
} from "./index";

const timestamp = "2026-08-08T16:00:00.000Z";
const changedAt = "2026-08-08T16:05:00.000Z";
const ids = {
  area: "11111111-1111-4111-8111-111111111111",
  source: "22222222-2222-4222-8222-222222222222",
  note: "33333333-3333-4333-8333-333333333333",
  audit: "44444444-4444-4444-8444-444444444444",
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

  it("exports, verifies and restores a complete backup", async () => {
    const { area, source, note, audit } = createTestRecords();
    await storage.transaction(async (repositories) => {
      await repositories.areas.create(area);
      await repositories.sources.create(source);
      await repositories.notes.create(note);
      await repositories.auditEntries.create(audit);
    });

    const backup = await storage.createBackup();
    const serialized = storage.serializeBackup(backup);
    await storage.clearAllData(DELETE_ALL_CONFIRMATION);

    const preview = await storage.previewImport(serialized);
    expect(preview.recordCounts).toEqual({ areas: 1, sources: 1, notes: 1, auditEntries: 1 });
    expect(preview.conflicts).toEqual([]);

    await storage.importBackup(preview);
    await expect(storage.notes.getById(note.id)).resolves.toEqual(note);
  });

  it("rejects changed backup content and reports existing-record conflicts", async () => {
    const { area } = createTestRecords();
    await storage.areas.create(area);
    const backup = await storage.createBackup();

    const conflictPreview = await storage.previewImport(backup);
    expect(conflictPreview.conflicts).toEqual([{ collection: "areas", id: area.id }]);
    await expect(storage.importBackup(conflictPreview)).rejects.toMatchObject({
      code: "IMPORT_CONFLICT",
    });

    const changedBackup = structuredClone(backup);
    changedBackup.data.areas[0] = { ...area, name: "Manipuliert" };
    await expect(storage.previewImport(changedBackup)).rejects.toMatchObject({
      code: "BACKUP_CHECKSUM_MISMATCH",
    });
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
