import "fake-indexeddb/auto";
import { createRhiaBrowserStorage } from "@rhia/storage-browser";
import { afterEach, describe, expect, it } from "vitest";
import { LocalMemoryService } from "./localMemoryService";
import {
  ensureRhProduktionStartReminder,
  isRhProduktionAnniversary,
  RH_PRODUKTION_START_CONFLICT_KEY,
} from "./businessStartService";

const databaseNames: string[] = [];

afterEach(async () => {
  for (const databaseName of databaseNames.splice(0)) {
    await createRhiaBrowserStorage({ databaseName }).deleteDatabase();
  }
});

describe("RH-Produktion-Betriebsstart", () => {
  it("speichert die ausdrücklich freigegebene jährliche Erinnerung genau einmal", async () => {
    const databaseName = `rhia-business-start-${crypto.randomUUID()}`;
    databaseNames.push(databaseName);
    const service = new LocalMemoryService({
      storage: createRhiaBrowserStorage({ databaseName }),
      now: () => "2026-08-12T10:00:00.000Z",
    });

    const first = await ensureRhProduktionStartReminder(service);
    const second = await ensureRhProduktionStartReminder(service);

    expect(first.id).toBe(second.id);
    expect(first.status).toBe("confirmed");
    expect(first.conflictKey).toBe(RH_PRODUKTION_START_CONFLICT_KEY);
    expect(first.value).toBe("2026-08-12");
  });

  it("erkennt den Jahrestag in der Zeitzone Europe/Berlin", () => {
    expect(isRhProduktionAnniversary(new Date("2026-08-12T08:00:00.000Z"))).toBe(true);
    expect(isRhProduktionAnniversary(new Date("2027-08-12T08:00:00.000Z"))).toBe(true);
    expect(isRhProduktionAnniversary(new Date("2026-08-13T08:00:00.000Z"))).toBe(false);
  });
});
