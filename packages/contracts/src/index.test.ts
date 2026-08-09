import {
  createArea,
  createAuditEntry,
  createDecision,
  createMemoryConflict,
  createMemoryFact,
  createNote,
  createSource,
} from "@rhia/domain";
import { describe, expect, it } from "vitest";
import {
  appStatusSchema,
  areaSchema,
  auditEntrySchema,
  decisionSchema,
  memoryConflictSchema,
  memoryFactSchema,
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
  factOne: "55555555-5555-4555-8555-555555555555",
  factTwo: "66666666-6666-4666-8666-666666666666",
  decision: "77777777-7777-4777-8777-777777777777",
  conflict: "88888888-8888-4888-8888-888888888888",
  device: "99999999-9999-4999-8999-999999999999",
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

describe("stage 2 memory contracts", () => {
  const proposedFact = createMemoryFact(
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

  it("validates proposed memory records without activating them", () => {
    const decision = createDecision(
      {
        areaId: ids.area,
        sourceIds: [ids.source],
        title: "API deaktiviert lassen",
        decisionText: "OpenAI bleibt in Stufe 2 deaktiviert.",
        rationale: "Stufe 2 arbeitet vollständig lokal.",
      },
      { id: ids.decision, timestamp, originDeviceId: ids.device },
    );
    const conflictingFact = createMemoryFact(
      {
        areaId: ids.area,
        sourceIds: [ids.source],
        knowledgeType: "profile",
        subject: "sir",
        predicate: "preferred-address",
        value: "Mike",
        conflictKey: proposedFact.conflictKey,
        displayText: "Die bevorzugte Anrede ist Mike.",
      },
      { id: ids.factTwo, timestamp, originDeviceId: ids.device },
    );
    const conflict = createMemoryConflict(
      {
        areaId: ids.area,
        conflictKey: proposedFact.conflictKey,
        factIds: [proposedFact.id, conflictingFact.id],
      },
      { id: ids.conflict, timestamp, originDeviceId: ids.device },
    );

    expect(memoryFactSchema.parse(proposedFact)).toEqual(proposedFact);
    expect(decisionSchema.parse(decision)).toEqual(decision);
    expect(memoryConflictSchema.parse(conflict)).toEqual(conflict);
    expect(
      [proposedFact, decision, conflict].every(
        (entity) => persistedEntitySchema.safeParse(entity).success,
      ),
    ).toBe(true);
  });

  it("requires explicit confirmation for confirmed facts and decisions", () => {
    expect(memoryFactSchema.safeParse({ ...proposedFact, status: "confirmed" }).success).toBe(
      false,
    );
    expect(
      memoryFactSchema.safeParse({
        ...proposedFact,
        status: "confirmed",
        confirmedAt: timestamp,
        confirmedBy: "sir",
      }).success,
    ).toBe(true);
    expect(memoryFactSchema.safeParse({ ...proposedFact, status: "disputed" }).success).toBe(false);

    const decision = createDecision(
      {
        areaId: ids.area,
        sourceIds: [ids.source],
        title: "Lokale Entscheidung",
        decisionText: "Die Daten bleiben lokal.",
        rationale: "Eine Quelle der Wahrheit.",
        status: "confirmed",
      },
      { id: ids.decision, timestamp, originDeviceId: ids.device },
    );
    expect(decisionSchema.safeParse(decision).success).toBe(false);
    expect(
      decisionSchema.safeParse({ ...decision, confirmedAt: timestamp, confirmedBy: "sir" }).success,
    ).toBe(true);
  });

  it("rejects unstable keys, impossible validity and contradictory deletion states", () => {
    expect(
      memoryFactSchema.safeParse({ ...proposedFact, conflictKey: "Nicht Stabil" }).success,
    ).toBe(false);
    expect(
      memoryFactSchema.safeParse({
        ...proposedFact,
        validFrom: "2026-08-09T12:00:00.000Z",
        validUntil: "2026-08-09T11:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(memoryFactSchema.safeParse({ ...proposedFact, status: "deleted" }).success).toBe(false);
  });

  it("keeps conflicts open until Sir supplies a complete resolution", () => {
    const conflict = createMemoryConflict(
      {
        areaId: ids.area,
        conflictKey: proposedFact.conflictKey,
        factIds: [ids.factOne, ids.factTwo],
      },
      { id: ids.conflict, timestamp, originDeviceId: ids.device },
    );

    expect(
      memoryConflictSchema.safeParse({
        ...conflict,
        resolvedAt: timestamp,
      }).success,
    ).toBe(false);
    expect(
      memoryConflictSchema.safeParse({
        ...conflict,
        status: "resolved",
        resolution: "keep-fact",
      }).success,
    ).toBe(false);
    expect(
      memoryConflictSchema.safeParse({
        ...conflict,
        status: "resolved",
        resolvedAt: timestamp,
        resolvedBy: "sir",
        resolution: "keep-fact",
        resolvedFactId: ids.factOne,
      }).success,
    ).toBe(true);
    expect(
      memoryConflictSchema.safeParse({
        ...conflict,
        status: "dismissed",
        resolvedAt: timestamp,
        resolvedBy: "sir",
        resolution: "not-a-conflict",
      }).success,
    ).toBe(true);
    expect(
      memoryConflictSchema.safeParse({
        ...conflict,
        status: "resolved",
        resolvedAt: timestamp,
        resolvedBy: "sir",
        resolution: "not-a-conflict",
      }).success,
    ).toBe(false);
    expect(
      memoryConflictSchema.safeParse({ ...conflict, factIds: [ids.factOne, ids.factOne] }).success,
    ).toBe(false);
  });
});
