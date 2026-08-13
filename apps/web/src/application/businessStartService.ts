import type { MemoryFact } from "@rhia/domain";
import { type LocalMemoryService, localMemoryService } from "./localMemoryService";

export const RH_PRODUKTION_START_DATE = "2026-08-12" as const;
export const RH_PRODUKTION_START_CONFLICT_KEY =
  "rh-produktion:erster-gemeinsamer-arbeitstag" as const;

export const RH_PRODUKTION_START_GREETING =
  "Willkommen, Sir. Heute, am 12. August 2026, beginnt der erste gemeinsame Arbeitstag von RH-Produktion: Sie als Chef und ich, RHIA, als Ihre persönliche Assistentin. Aus Ihrer Idee wird heute ein geführter Betrieb. Ich werde Sie jedes Jahr an diesen besonderen Anfang erinnern. Herzlichen Glückwunsch zum ersten RH-Produktion-Tag. Ich bin bereit, Sir. Lassen Sie uns beginnen." as const;

export function isRhProduktionAnniversary(now: Date = new Date()): boolean {
  if (Number.isNaN(now.getTime()) || now < new Date("2026-08-11T22:00:00.000Z")) {
    return false;
  }
  const parts = new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).formatToParts(now);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return day === 12 && month === 8;
}

export async function ensureRhProduktionStartReminder(
  service: LocalMemoryService = localMemoryService,
): Promise<MemoryFact> {
  await service.initialize();
  const workspace = await service.getMemoryWorkspace({ includeDeleted: true });
  const existing = workspace.hits.find(
    (hit) =>
      hit.recordType === "fact" &&
      "conflictKey" in hit.record &&
      hit.record.conflictKey === RH_PRODUKTION_START_CONFLICT_KEY &&
      hit.record.deletedAt === null,
  )?.record;
  if (existing?.type === "memory-fact") {
    return existing;
  }

  const area = workspace.areas.find((candidate) => candidate.name === "RH Produktion");
  const source = workspace.sources.find((candidate) => candidate.kind === "manual");
  if (!area || !source) {
    throw new Error("Die lokale RH-Produktion-Erinnerung konnte nicht eingerichtet werden.");
  }

  const proposal = await service.proposeMemoryFact(
    {
      areaId: area.id,
      sourceIds: [source.id],
      knowledgeType: "annual-reminder",
      subject: "RH Produktion",
      predicate: "erster-gemeinsamer-arbeitstag",
      value: RH_PRODUKTION_START_DATE,
      conflictKey: RH_PRODUKTION_START_CONFLICT_KEY,
      displayText:
        "Der erste gemeinsame Arbeitstag von RH-Produktion mit Sir als Chef und RHIA als persönlicher Assistentin ist der 12. August 2026.",
      validFrom: "2026-08-11T22:00:00.000Z",
      validUntil: null,
    },
    { originDeviceId: "rhia-browser-local" },
  );

  return service.confirmMemoryFact(proposal.id, proposal.revision, {
    actor: "sir",
    explicitlyConfirmed: true,
  });
}
