import { createArea, createSource } from "@rhia/domain";
import { createRhiaBrowserStorage } from "@rhia/storage-browser";
import { afterEach, describe, expect, it } from "vitest";
import { LocalMemoryService } from "./localMemoryService";

const timestamp = "2026-08-09T15:05:00.000Z";
const confirmation = { actor: "sir", explicitlyConfirmed: true } as const;
const discard = { actor: "sir", explicitlyDiscarded: true } as const;
const restore = { actor: "sir", explicitlyRestored: true } as const;

const storages: Array<ReturnType<typeof createRhiaBrowserStorage>> = [];

afterEach(async () => {
  await Promise.all(storages.splice(0).map((storage) => storage.deleteDatabase()));
});

describe("LocalMemoryService restored correction workflow", () => {
  it("can confirm a restored correction whose predecessor is already superseded", async () => {
    const storage = createRhiaBrowserStorage({
      databaseName: `rhia-restored-correction-${crypto.randomUUID()}`,
      now: () => timestamp,
    });
    storages.push(storage);
    const service = new LocalMemoryService({ storage, now: () => timestamp });
    await service.initialize();

    const area = await storage.areas.create(createArea({ name: "Allgemein" }, { timestamp }));
    const source = await storage.sources.create(
      createSource({ kind: "manual", label: "Direkte Eingabe durch Sir" }, { timestamp }),
    );
    const baseInput = {
      areaId: area.id,
      sourceIds: [source.id],
      knowledgeType: "test",
      subject: "sir",
      predicate: "testcode",
      conflictKey: "sir.testcode",
    };

    const originalProposal = await service.proposeMemoryFact(
      {
        ...baseInput,
        value: "Bordeaux 47",
        displayText: "Der künstliche Testcode ist Bordeaux 47.",
      },
      { originDeviceId: "rhia-local-browser" },
    );
    const original = await service.confirmMemoryFact(
      originalProposal.id,
      originalProposal.revision,
      confirmation,
    );

    const correctionProposal = await service.correctMemoryFact(
      original.id,
      original.revision,
      {
        ...baseInput,
        value: "Bordeaux 48",
        displayText: "Der künstliche Testcode ist Bordeaux 48.",
      },
      { originDeviceId: "rhia-local-browser" },
    );
    const correction = await service.confirmMemoryFact(
      correctionProposal.id,
      correctionProposal.revision,
      confirmation,
    );

    const discarded = await service.discardMemoryFact(correction.id, correction.revision, discard);
    const restored = await service.restoreMemoryFact(discarded.id, discarded.revision, restore);
    const reconfirmed = await service.confirmMemoryFact(
      restored.id,
      restored.revision,
      confirmation,
    );

    expect(reconfirmed).toMatchObject({
      id: correction.id,
      status: "confirmed",
      value: "Bordeaux 48",
      supersedesId: original.id,
    });
    await expect(storage.memoryFacts.getById(original.id)).resolves.toMatchObject({
      status: "superseded",
    });
    await expect(service.getMemoryFactHistory(reconfirmed.id)).resolves.toMatchObject({
      activeVersion: expect.objectContaining({ id: correction.id, status: "confirmed" }),
      versions: expect.arrayContaining([
        expect.objectContaining({ id: original.id, status: "superseded" }),
        expect.objectContaining({ id: correction.id, status: "confirmed" }),
      ]),
    });
  });
});
