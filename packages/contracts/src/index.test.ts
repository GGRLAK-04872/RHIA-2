import { createArea, createAuditEntry, createNote, createSource } from "@rhia/domain";
import { describe, expect, it } from "vitest";
import {
  appStatusSchema,
  areaSchema,
  auditEntrySchema,
  noteSchema,
  persistedEntitySchema,
  sourceSchema,
} from "./index";

const timestamp = "2026-08-08T16:00:00.000Z";
const ids = {
  area: "11111111-1111-4111-8111-111111111111",
  source: "22222222-2222-4222-8222-222222222222",
  note: "33333333-3333-4333-8333-333333333333",
  audit: "44444444-4444-4444-8444-444444444444",
} as const;

describe("stage 1 contracts", () => {
  it("validates Area, Source, Note and AuditEntry", () => {
    const area = createArea({ name: "RHIA" }, { id: ids.area, timestamp });
    const source = createSource(
      { kind: "manual", label: "Direkte Eingabe" },
      { id: ids.source, timestamp },
    );
    const note = createNote(
      { areaId: area.id, sourceId: source.id, title: "Test", body: "Inhalt" },
      { id: ids.note, timestamp },
    );
    const audit = createAuditEntry(
      { entityType: note.type, entityId: note.id, entityRevision: 1, action: "create" },
      { id: ids.audit, timestamp },
    );

    expect(areaSchema.parse(area)).toEqual(area);
    expect(sourceSchema.parse(source)).toEqual(source);
    expect(noteSchema.parse(note)).toEqual(note);
    expect(auditEntrySchema.parse(audit)).toEqual(audit);
    expect(
      [area, source, note, audit].every(
        (entity) => persistedEntitySchema.safeParse(entity).success,
      ),
    ).toBe(true);
  });

  it("rejects invalid IDs and impossible timelines", () => {
    const area = createArea(
      { name: "RHIA" },
      { id: ids.area, timestamp: "2026-08-08T16:00:00.000Z" },
    );

    expect(areaSchema.safeParse({ ...area, id: "not-a-uuid" }).success).toBe(false);
    expect(areaSchema.safeParse({ ...area, updatedAt: "2026-08-08T15:59:59.000Z" }).success).toBe(
      false,
    );
  });

  it("permits only the local-first, API-disabled stage 1 status", () => {
    expect(
      appStatusSchema.safeParse({
        version: "0.2.0",
        stage: 1,
        mode: "local-first",
        apiEnabled: false,
        persistenceEnabled: true,
      }).success,
    ).toBe(true);

    expect(
      appStatusSchema.safeParse({
        version: "0.2.0",
        stage: 1,
        mode: "local-first",
        apiEnabled: true,
        persistenceEnabled: true,
      }).success,
    ).toBe(false);
  });
});
