import { describe, expect, it } from "vitest";
import {
  RHIA_RUNTIME,
  RHIA_SCHEMA_VERSION,
  RHIA_STAGE,
  createArea,
  createAuditEntry,
  createNote,
  createSource,
} from "./index";

const timestamp = "2026-08-08T16:00:00.000Z";
const ids = {
  area: "11111111-1111-4111-8111-111111111111",
  source: "22222222-2222-4222-8222-222222222222",
  note: "33333333-3333-4333-8333-333333333333",
  audit: "44444444-4444-4444-8444-444444444444",
} as const;

describe("RHIA stage 1 domain foundation", () => {
  it("activates IndexedDB as the only local source while cloud and AI stay disabled", () => {
    expect(RHIA_STAGE).toBe(1);
    expect(RHIA_RUNTIME).toEqual({
      sourceOfTruth: "indexeddb",
      cloudRuntime: false,
      externalAi: false,
      persistence: true,
    });
  });

  it("creates all stage 1 records with stable metadata", () => {
    const area = createArea({ name: "RHIA" }, { id: ids.area, timestamp });
    const source = createSource(
      { kind: "manual", label: "Direkte Eingabe" },
      { id: ids.source, timestamp },
    );
    const note = createNote(
      {
        areaId: area.id,
        sourceId: source.id,
        title: "Testnotiz",
        body: "Nur künstliche Testdaten.",
      },
      { id: ids.note, timestamp },
    );
    const audit = createAuditEntry(
      {
        entityType: note.type,
        entityId: note.id,
        entityRevision: note.revision,
        action: "create",
      },
      { id: ids.audit, timestamp },
    );

    for (const entity of [area, source, note, audit]) {
      expect(entity).toMatchObject({
        schemaVersion: RHIA_SCHEMA_VERSION,
        revision: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
      });
    }

    expect(note).toMatchObject({ areaId: area.id, sourceId: source.id });
    expect(audit).toMatchObject({ entityId: note.id, occurredAt: timestamp });
  });
});
