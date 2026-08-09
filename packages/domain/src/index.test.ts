import { describe, expect, it } from "vitest";
import {
  RHIA_RUNTIME,
  RHIA_SCHEMA_VERSION,
  RHIA_STAGE,
  confirmDecisionProposal,
  confirmMemoryFactProposal,
  createArea,
  createAuditEntry,
  createDecision,
  createMemoryConflict,
  createMemoryFact,
  createNote,
  createSource,
  revokeDecision,
  supersedeDecision,
  supersedeMemoryFact,
} from "./index";

const timestamp = "2026-08-08T16:00:00.000Z";
const confirmedAt = "2026-08-08T16:05:00.000Z";
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

  it("creates proposed memory records without silently confirming them", () => {
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
        title: "API deaktiviert lassen",
        decisionText: "OpenAI bleibt in Stufe 2 deaktiviert.",
        rationale: "Stufe 2 arbeitet vollständig lokal.",
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

    expect(factOne).toMatchObject({
      type: "memory-fact",
      status: "proposed",
      confirmedAt: null,
      confirmedBy: null,
      originDeviceId: ids.device,
    });
    expect(decision).toMatchObject({
      type: "decision",
      status: "proposed",
      confirmedAt: null,
      confirmedBy: null,
    });
    expect(conflict).toMatchObject({
      type: "memory-conflict",
      status: "open",
      factIds: [factOne.id, factTwo.id],
      resolution: null,
    });
  });

  it("ignores untrusted activation fields when creating proposals", () => {
    const untrustedInput = {
      areaId: ids.area,
      sourceIds: [ids.source],
      knowledgeType: "profile",
      subject: "sir",
      predicate: "preferred-address",
      value: "Sir",
      conflictKey: "sir.profile.preferred-address",
      displayText: "Die bevorzugte Anrede ist Sir.",
      status: "confirmed",
      confirmedAt,
      confirmedBy: "sir",
    };

    const fact = createMemoryFact(untrustedInput, {
      id: ids.factOne,
      timestamp,
      originDeviceId: ids.device,
    });

    expect(fact).toMatchObject({
      status: "proposed",
      confirmedAt: null,
      confirmedBy: null,
    });
  });

  it("confirms facts and decisions only through the explicit transition", () => {
    const fact = createMemoryFact(
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
    const confirmation = { actor: "sir", explicitlyConfirmed: true, confirmedAt } as const;

    expect(confirmMemoryFactProposal(fact, confirmation)).toMatchObject({
      status: "confirmed",
      confirmedAt,
      confirmedBy: "sir",
    });
    expect(confirmDecisionProposal(decision, confirmation)).toMatchObject({
      status: "confirmed",
      confirmedAt,
      confirmedBy: "sir",
    });
  });

  it("rejects implicit confirmation and repeated activation", () => {
    const fact = createMemoryFact(
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

    expect(() =>
      confirmMemoryFactProposal(fact, {
        actor: "sir",
        explicitlyConfirmed: false,
        confirmedAt,
      } as never),
    ).toThrow(expect.objectContaining({ code: "CONFIRMATION_REQUIRED" }));

    const confirmed = confirmMemoryFactProposal(fact, {
      actor: "sir",
      explicitlyConfirmed: true,
      confirmedAt,
    });
    expect(() =>
      confirmMemoryFactProposal(confirmed, {
        actor: "sir",
        explicitlyConfirmed: true,
        confirmedAt,
      }),
    ).toThrow(expect.objectContaining({ code: "INVALID_STATE_TRANSITION" }));
  });

  it("supersedes only confirmed predecessors and revokes decisions without losing history", () => {
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
    const proposedDecision = createDecision(
      {
        areaId: ids.area,
        sourceIds: [ids.source],
        title: "API deaktiviert lassen",
        decisionText: "OpenAI bleibt in Stufe 2 deaktiviert.",
        rationale: "Stufe 2 arbeitet vollständig lokal.",
      },
      { id: ids.decision, timestamp, originDeviceId: ids.device },
    );

    expect(() => supersedeMemoryFact(proposedFact)).toThrow(
      expect.objectContaining({ code: "INVALID_STATE_TRANSITION" }),
    );
    expect(() => supersedeDecision(proposedDecision)).toThrow(
      expect.objectContaining({ code: "INVALID_STATE_TRANSITION" }),
    );

    const confirmedFact = confirmMemoryFactProposal(proposedFact, {
      actor: "sir",
      explicitlyConfirmed: true,
      confirmedAt,
    });
    const confirmedDecision = confirmDecisionProposal(proposedDecision, {
      actor: "sir",
      explicitlyConfirmed: true,
      confirmedAt,
    });

    expect(supersedeMemoryFact(confirmedFact)).toMatchObject({
      id: confirmedFact.id,
      status: "superseded",
      confirmedAt,
    });
    expect(supersedeDecision(confirmedDecision)).toMatchObject({
      id: confirmedDecision.id,
      status: "superseded",
      confirmedAt,
    });
    expect(revokeDecision(confirmedDecision)).toMatchObject({
      id: confirmedDecision.id,
      status: "revoked",
      confirmedAt,
    });
  });
});
