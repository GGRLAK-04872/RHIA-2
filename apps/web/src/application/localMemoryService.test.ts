import { createArea, createSource } from "@rhia/domain";
import { createRhiaBrowserStorage, type RhiaBrowserStorage } from "@rhia/storage-browser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type ExplicitSirConfirmation,
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
    };

    const fact = await service.proposeMemoryFact(untrustedInput, {
      originDeviceId: ids.device,
    });

    expect(fact).toMatchObject({
      status: "proposed",
      confirmedAt: null,
      confirmedBy: null,
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
});
