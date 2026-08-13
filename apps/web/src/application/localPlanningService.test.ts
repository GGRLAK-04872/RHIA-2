import "fake-indexeddb/auto";
import { createTask } from "@rhia/domain";
import { createRhiaBrowserStorage, type RhiaBrowserStorage } from "@rhia/storage-browser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalPlanningService } from "./localPlanningService";

let storage: RhiaBrowserStorage;
let service: LocalPlanningService;

beforeEach(async () => {
  storage = createRhiaBrowserStorage({
    databaseName: `rhia-planning-test-${crypto.randomUUID()}`,
    now: () => "2026-08-20T18:00:00.000Z",
  });
  service = new LocalPlanningService(storage);
  await service.initialize();
});

afterEach(async () => {
  await storage.deleteDatabase();
});

describe("stage 4 local planning service", () => {
  it("persists weekly protection, feedback, follow-up planning and an evening review", async () => {
    const initial = await service.getSnapshot();
    const privateArea = initial.workspace.areas.find((area) => area.name === "Privat");
    expect(initial.workspace.areas.map((area) => area.name).toSorted()).toEqual([
      "Privat",
      "RH Produktion",
      "RHIA",
      "Shadow Grown",
    ]);
    if (!privateArea) {
      throw new Error("Künstlicher Testbereich fehlt.");
    }
    const task = createTask(
      {
        areaId: privateArea.id,
        title: "Künstlicher Planungstest",
        status: "planned",
        dueAt: "2026-08-11T12:00:00.000Z",
        importance: "high",
        estimatedMinutes: 60,
      },
      {
        id: "11111111-2222-4333-8444-555555555555",
        timestamp: "2026-08-10T07:00:00.000Z",
      },
    );
    await storage.tasks.create(task);

    const weekly = await service.generatePlan({
      kind: "week",
      periodStart: "2026-08-10T00:00:00.000Z",
      periodEnd: "2026-08-17T00:00:00.000Z",
      generatedAt: "2026-08-10T08:00:00.000Z",
      availability: Array.from({ length: 5 }, (_, index) => ({
        startAt: `2026-08-${String(10 + index).padStart(2, "0")}T18:00:00.000Z`,
        endAt: `2026-08-${String(10 + index).padStart(2, "0")}T20:00:00.000Z`,
      })),
    });
    const weekBriefing = weekly.briefings.find((briefing) => briefing.kind === "week");
    const taskBlock = weekly.workBlocks.find((block) => block.taskId === task.id);
    expect(weekBriefing).toMatchObject({ protectionMinutes: 120, availableMinutes: 600 });
    expect(weekly.workBlocks.filter((block) => block.kind === "protection")).toHaveLength(2);
    expect(taskBlock?.durationMinutes).toBe(60);
    if (!taskBlock) {
      throw new Error("Künstlicher Aufgabenblock fehlt.");
    }

    const withFeedback = await service.recordFeedback({
      workBlockId: taskBlock.id,
      result: "partial",
      reason: "time-too-short",
      actualMinutes: 30,
      note: "Künstliche Rückmeldung",
      recordedAt: "2026-08-10T20:00:00.000Z",
    });
    expect(withFeedback.feedback).toHaveLength(1);
    expect(withFeedback.workBlocks.find((block) => block.id === taskBlock.id)?.status).toBe(
      "partial",
    );

    const followUp = await service.generatePlan({
      kind: "morning",
      periodStart: "2026-08-11T00:00:00.000Z",
      periodEnd: "2026-08-12T00:00:00.000Z",
      generatedAt: "2026-08-11T08:00:00.000Z",
      availability: [{ startAt: "2026-08-11T09:00:00.000Z", endAt: "2026-08-11T13:00:00.000Z" }],
    });
    const followUpBriefing = followUp.briefings.find(
      (briefing) =>
        briefing.kind === "morning" && briefing.generatedAt === "2026-08-11T08:00:00.000Z",
    );
    const followUpBlock = followUp.workBlocks.find(
      (block) => block.briefingId === followUpBriefing?.id && block.taskId === task.id,
    );
    expect(followUpBlock?.durationMinutes).toBe(90);

    const review = await service.createEveningReview(
      "2026-08-10T00:00:00.000Z",
      "2026-08-12T00:00:00.000Z",
      "2026-08-10T21:00:00.000Z",
    );
    expect(review.briefings.find((briefing) => briefing.kind === "evening")?.summary).toContain(
      "1 teilweise",
    );
    if (!followUpBriefing) {
      throw new Error("Künstliches Folgebriefing fehlt.");
    }

    const trashed = await service.moveBriefingToTrash(
      followUpBriefing.id,
      followUpBriefing.revision,
    );
    const deletedBriefing = trashed.trash.briefings.find(
      (briefing) => briefing.id === followUpBriefing.id,
    );
    expect(deletedBriefing).toBeDefined();
    if (!deletedBriefing) {
      throw new Error("Künstliches Papierkorb-Briefing fehlt.");
    }
    const restored = await service.restoreBriefing(deletedBriefing.id, deletedBriefing.revision);
    expect(restored.briefings.some((briefing) => briefing.id === followUpBriefing.id)).toBe(true);
  });
});
