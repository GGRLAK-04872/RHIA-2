import { createArea, createSource } from "@rhia/domain";
import { createRhiaBrowserStorage, type RhiaBrowserStorage } from "@rhia/storage-browser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type ExplicitSirConfirmation,
  type ExplicitSirDiscard,
  type ExplicitSirRejection,
  LocalMemoryService,
} from "./localMemoryService";

const timestamp = "2026-08-09T09:00:00.000Z";
const ids = {
  area: "11111111-1111-4111-8111-111111111111",
  source: "22222222-2222-4222-8222-222222222222",
  missingSource: "33333333-3333-4333-8333-333333333333",
  device: "44444444-4444-4444-8444-444444444444",
} as const;

const confirmation = { actor: "sir", explicitlyConfirmed: true } as const;
const rejection = { actor: "sir", explicitlyRejected: true } as const;
const discard = { actor: "sir", explicitlyDiscarded: true } as const;

let storage: RhiaBrowserStorage;
let service: LocalMemoryService;

function factInput() {
  return {
    areaId: ids.area,
    sourceIds: [ids.source],
    knowledgeType: "profile",
    subject: "sir",
    predicate: "preferred-address",
    value: "Sir",
    conflictKey: "sir.profile.preferred-address",
    displayText: "Die bevorzugte Anrede ist Sir.",
  };
}

function decisionInput() {
  return {
    areaId: ids.area,
    sourceIds: [ids.source],
    title: "OpenAI deaktiviert lassen",
    decisionText: "OpenAI bleibt in Stufe 2 deaktiviert.",
    rationale: "Das Gedächtnis arbeitet vollständig lokal.",
  };
}

beforeEach(async () => {
  storage = createRhiaBrowserStorage({
    databaseName: `rhia-memory-service-test-${crypto.randomUUID()}`,
    now: () => timestamp,
  });
  service = new LocalMemoryService({ storage, now: () => timestamp });
  await service.initialize();
  await storage.areas.create(createArea({ name: "RHIA" }, { id: ids.area, timestamp }));
  await storage.sources.create(
    createSource(
      { kind: "manual", label: "Direkte Eingabe durch Sir" },
      { id: ids.source, timestamp },
    ),
  );
});

afterEach(async () => {
  await storage.deleteDatabase();
});

describe("LocalMemoryService proposal workflow", () => {
  it("stores untrusted fact input only as an inactive proposal", async () => {
    const untrustedInput = {
      ...factInput(),
      status: "confirmed",
      confirmedAt: timestamp,
      confirmedBy: "sir",
      supersedesId: "55555555-5555-4555-8555-555555555555",
    };

    const fact = await service.proposeMemoryFact(untrustedInput, {
      originDeviceId: ids.device,
    });

    expect(fact).toMatchObject({
      status: "proposed",
      confirmedAt: null,
      confirmedBy: null,
      supersedesId: null,
      revision: 1,
    });
    await expect(storage.memoryFacts.getById(fact.id)).resolves.toEqual(fact);
    await expect(storage.auditEntries.list()).resolves.toEqual([
      expect.objectContaining({
        entityId: fact.id,
        action: "create",
        summary: "Gedächtnisfakt als Vorschlag gespeichert.",
      }),
    ]);
  });

  it("requires an explicit Sir confirmation and prevents repeated activation", async () => {
    const fact = await service.proposeMemoryFact(factInput(), { originDeviceId: ids.device });
    const implicitConfirmation = {
      actor: "sir",
      explicitlyConfirmed: false,
    } as unknown as ExplicitSirConfirmation;

    await expect(
      service.confirmMemoryFact(fact.id, fact.revision, implicitConfirmation),
    ).rejects.toMatchObject({ code: "CONFIRMATION_REQUIRED" });
    await expect(storage.memoryFacts.getById(fact.id)).resolves.toMatchObject({
      status: "proposed",
      revision: 1,
    });

    const confirmed = await service.confirmMemoryFact(fact.id, fact.revision, confirmation);
    expect(confirmed).toMatchObject({
      status: "confirmed",
      confirmedAt: timestamp,
      confirmedBy: "sir",
      revision: 2,
    });
    await expect(
      service.confirmMemoryFact(confirmed.id, confirmed.revision, confirmation),
    ).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION" });
    await expect(
      service.rejectMemoryFact(confirmed.id, confirmed.revision, rejection),
    ).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION" });

    const audits = await storage.auditEntries.list();
    expect(audits).toHaveLength(2);
    expect(audits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entityId: fact.id, action: "create" }),
        expect.objectContaining({ entityId: fact.id, action: "update", entityRevision: 2 }),
      ]),
    );
  });

  it("confirms decisions and rejects pending fact and decision proposals", async () => {
    const confirmedDecisionProposal = await service.proposeDecision(decisionInput(), {
      originDeviceId: ids.device,
    });
    const rejectedDecisionProposal = await service.proposeDecision(
      { ...decisionInput(), title: "Abgelehnter Entscheidungsvorschlag" },
      { originDeviceId: ids.device },
    );
    const rejectedFactProposal = await service.proposeMemoryFact(factInput(), {
      originDeviceId: ids.device,
    });

    const confirmedDecision = await service.confirmDecision(
      confirmedDecisionProposal.id,
      confirmedDecisionProposal.revision,
      confirmation,
    );
    const rejectedDecision = await service.rejectDecision(
      rejectedDecisionProposal.id,
      rejectedDecisionProposal.revision,
      rejection,
    );
    const rejectedFact = await service.rejectMemoryFact(
      rejectedFactProposal.id,
      rejectedFactProposal.revision,
      rejection,
    );

    expect(confirmedDecision).toMatchObject({ status: "confirmed", revision: 2 });
    expect(rejectedDecision).toMatchObject({ status: "deleted", revision: 2 });
    expect(rejectedFact).toMatchObject({ status: "deleted", revision: 2 });
    await expect(storage.decisions.getById(rejectedDecision.id)).resolves.toBeUndefined();
    await expect(storage.memoryFacts.getById(rejectedFact.id)).resolves.toBeUndefined();
    await expect(
      storage.decisions.getById(rejectedDecision.id, { includeDeleted: true }),
    ).resolves.toEqual(rejectedDecision);
  });

  it("rolls back proposals whose area or source is missing", async () => {
    await expect(
      service.proposeMemoryFact(
        { ...factInput(), sourceIds: [ids.missingSource] },
        { originDeviceId: ids.device },
      ),
    ).rejects.toMatchObject({ code: "RECORD_NOT_FOUND" });

    await expect(storage.memoryFacts.list({ includeDeleted: true })).resolves.toEqual([]);
    await expect(storage.auditEntries.list({ includeDeleted: true })).resolves.toEqual([]);
  });

  it("requires an explicit Sir rejection", async () => {
    const decision = await service.proposeDecision(decisionInput(), {
      originDeviceId: ids.device,
    });
    const implicitRejection = {
      actor: "sir",
      explicitlyRejected: false,
    } as unknown as ExplicitSirRejection;

    await expect(
      service.rejectDecision(decision.id, decision.revision, implicitRejection),
    ).rejects.toMatchObject({ code: "CONFIRMATION_REQUIRED" });
    await expect(storage.decisions.getById(decision.id)).resolves.toMatchObject({
      status: "proposed",
      revision: 1,
    });
  });

  it("keeps the confirmed fact active until its correction is explicitly confirmed", async () => {
    const proposal = await service.proposeMemoryFact(factInput(), {
      originDeviceId: ids.device,
    });
    const original = await service.confirmMemoryFact(proposal.id, proposal.revision, confirmation);

    const correction = await service.correctMemoryFact(
      original.id,
      original.revision,
      {
        ...factInput(),
        value: "Sir, privat Mike",
        displayText: "Die bevorzugte Anrede ist Sir, privat Mike.",
      },
      { originDeviceId: ids.device },
    );

    expect(correction).toMatchObject({
      status: "proposed",
      supersedesId: original.id,
      confirmedAt: null,
    });
    await expect(storage.memoryFacts.getById(original.id)).resolves.toMatchObject({
      status: "confirmed",
      revision: 2,
    });
    await expect(service.getMemoryFactHistory(correction.id)).resolves.toMatchObject({
      activeVersion: { id: original.id, status: "confirmed" },
      versions: expect.arrayContaining([
        expect.objectContaining({ id: original.id }),
        expect.objectContaining({ id: correction.id }),
      ]),
    });
    await expect(
      service.correctMemoryFact(original.id, original.revision, factInput(), {
        originDeviceId: ids.device,
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION" });
  });

  it("atomically activates a correction and preserves its predecessor as superseded", async () => {
    const proposal = await service.proposeMemoryFact(factInput(), {
      originDeviceId: ids.device,
    });
    const original = await service.confirmMemoryFact(proposal.id, proposal.revision, confirmation);
    const correction = await service.correctMemoryFact(
      original.id,
      original.revision,
      {
        ...factInput(),
        value: "Sir, privat Mike",
        displayText: "Die bevorzugte Anrede ist Sir, privat Mike.",
      },
      { originDeviceId: ids.device },
    );

    const confirmedCorrection = await service.confirmMemoryFact(
      correction.id,
      correction.revision,
      confirmation,
    );
    const predecessor = await storage.memoryFacts.getById(original.id);
    const history = await service.getMemoryFactHistory(original.id);

    expect(confirmedCorrection).toMatchObject({
      status: "confirmed",
      supersedesId: original.id,
      revision: 2,
    });
    expect(predecessor).toMatchObject({ status: "superseded", revision: 3 });
    expect(history.activeVersion).toEqual(confirmedCorrection);
    expect(history.versions).toHaveLength(2);
    await expect(
      service.correctMemoryFact(original.id, 3, factInput(), { originDeviceId: ids.device }),
    ).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION" });
  });

  it("rolls back predecessor replacement when the correction revision is stale", async () => {
    const proposal = await service.proposeMemoryFact(factInput(), {
      originDeviceId: ids.device,
    });
    const original = await service.confirmMemoryFact(proposal.id, proposal.revision, confirmation);
    const correction = await service.correctMemoryFact(
      original.id,
      original.revision,
      { ...factInput(), value: "Neue Fassung" },
      { originDeviceId: ids.device },
    );
    await storage.memoryFacts.replace(
      { ...correction, displayText: "Extern geänderte Korrekturfassung." },
      correction.revision,
    );

    await expect(
      service.confirmMemoryFact(correction.id, correction.revision, confirmation),
    ).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(storage.memoryFacts.getById(original.id)).resolves.toMatchObject({
      status: "confirmed",
      revision: 2,
    });
    await expect(storage.memoryFacts.getById(correction.id)).resolves.toMatchObject({
      status: "proposed",
      revision: 2,
    });
  });

  it("discards a correction without changing the confirmed predecessor", async () => {
    const proposal = await service.proposeMemoryFact(factInput(), {
      originDeviceId: ids.device,
    });
    const original = await service.confirmMemoryFact(proposal.id, proposal.revision, confirmation);
    const correction = await service.correctMemoryFact(
      original.id,
      original.revision,
      { ...factInput(), value: "Verworfener Wert" },
      { originDeviceId: ids.device },
    );

    const rejected = await service.rejectMemoryFact(correction.id, correction.revision, rejection);
    const history = await service.getMemoryFactHistory(original.id);

    expect(rejected).toMatchObject({ status: "deleted", supersedesId: original.id });
    expect(history.activeVersion).toEqual(original);
    expect(history.versions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: original.id, status: "confirmed" }),
        expect.objectContaining({ id: correction.id, status: "deleted" }),
      ]),
    );
  });

  it("replaces and revokes decisions while retaining their complete version history", async () => {
    const proposal = await service.proposeDecision(decisionInput(), {
      originDeviceId: ids.device,
    });
    const original = await service.confirmDecision(proposal.id, proposal.revision, confirmation);
    const correction = await service.correctDecision(
      original.id,
      original.revision,
      {
        ...decisionInput(),
        title: "OpenAI bis Stufe 5 deaktiviert lassen",
        decisionText: "OpenAI bleibt mindestens bis Stufe 5 deaktiviert.",
      },
      { originDeviceId: ids.device },
    );
    const replacement = await service.confirmDecision(
      correction.id,
      correction.revision,
      confirmation,
    );
    const revoked = await service.discardDecision(replacement.id, replacement.revision, discard);
    const history = await service.getDecisionHistory(original.id);

    await expect(storage.decisions.getById(original.id)).resolves.toMatchObject({
      status: "superseded",
    });
    expect(revoked).toMatchObject({ status: "revoked", supersedesId: original.id });
    expect(history.activeVersion).toBeNull();
    expect(history.versions).toHaveLength(2);
  });

  it("requires Sir's explicit discard signal before deleting confirmed facts", async () => {
    const proposal = await service.proposeMemoryFact(factInput(), {
      originDeviceId: ids.device,
    });
    const confirmed = await service.confirmMemoryFact(proposal.id, proposal.revision, confirmation);
    const implicitDiscard = {
      actor: "sir",
      explicitlyDiscarded: false,
    } as unknown as ExplicitSirDiscard;

    await expect(
      service.discardMemoryFact(confirmed.id, confirmed.revision, implicitDiscard),
    ).rejects.toMatchObject({ code: "CONFIRMATION_REQUIRED" });
    const discarded = await service.discardMemoryFact(confirmed.id, confirmed.revision, discard);

    expect(discarded).toMatchObject({ status: "deleted", revision: 3 });
    await expect(service.getMemoryFactHistory(discarded.id)).resolves.toMatchObject({
      activeVersion: null,
      versions: [expect.objectContaining({ id: discarded.id, status: "deleted" })],
    });
  });
});
