import "fake-indexeddb/auto";
import { createTask, WORK_HUB_AREA_NAMES } from "@rhia/domain";
import { createRhiaBrowserStorage, type RhiaBrowserStorage } from "@rhia/storage-browser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalWorkHubService } from "./localWorkHubService";

const timestamp = "2026-08-09T08:00:00.000Z";
const changedAt = "2026-08-09T11:00:00.000Z";
const ids = {
  taskOne: "11111111-1111-4111-8111-111111111111",
  taskTwo: "22222222-2222-4222-8222-222222222222",
} as const;

let storage: RhiaBrowserStorage;
let service: LocalWorkHubService;

beforeEach(async () => {
  storage = createRhiaBrowserStorage({
    databaseName: `rhia-work-hub-${crypto.randomUUID()}`,
    now: () => changedAt,
  });
  service = new LocalWorkHubService(storage);
});

afterEach(async () => {
  await storage.deleteDatabase();
});

describe("stage 3.7 local work hub service", () => {
  it("creates the four required areas and stores project and goal with audit entries", async () => {
    const initialized = await service.initialize();
    expect(initialized.workspace.areas.map((area) => area.name).toSorted()).toEqual(
      [...WORK_HUB_AREA_NAMES].toSorted(),
    );
    const rhia = initialized.workspace.areas.find((area) => area.name === "RHIA");
    expect(rhia).toBeDefined();

    const withProject = await service.createProject({
      areaId: rhia?.id ?? "",
      title: "RHIA 2.0",
    });
    const project = withProject.workspace.projects[0];
    expect(project).toMatchObject({ title: "RHIA 2.0", areaId: rhia?.id });

    const withGoal = await service.createGoal({
      projectId: project?.id ?? "",
      title: "Arbeitszentrale abschließen",
    });
    expect(withGoal.workspace.goals[0]).toMatchObject({
      title: "Arbeitszentrale abschließen",
      projectId: project?.id,
    });
    expect(
      withGoal.auditEntries.filter((entry) => entry.action === "create").length,
    ).toBeGreaterThanOrEqual(6);
  });

  it("corrects, manually prioritizes, deletes and restores a task without losing decisions", async () => {
    const initialized = await service.initialize();
    const rhia = initialized.workspace.areas.find((area) => area.name === "RHIA");
    if (!rhia) {
      throw new Error("Künstlicher RHIA-Testbereich fehlt.");
    }
    const task = createTask(
      { areaId: rhia.id, title: "Alte Bezeichnung", status: "planned" },
      { id: ids.taskOne, timestamp },
    );
    await storage.tasks.create(task);

    const corrected = await service.updateTask(task.id, 1, {
      areaId: rhia.id,
      projectId: null,
      goalId: null,
      title: "Korrigierte Bezeichnung",
      description: null,
      status: "planned",
      dueAt: null,
      importance: "high",
      estimatedMinutes: 45,
      moneyImpact: "none",
      expectedIncomeCents: null,
      expectedIncomeAt: null,
      blockedReason: null,
    });
    const correctedTask = corrected.workspace.tasks[0];
    expect(correctedTask).toMatchObject({ title: "Korrigierte Bezeichnung", revision: 2 });

    const prioritized = await service.setTaskManualPriority(correctedTask?.id ?? "", 2, 1, {
      actor: "sir",
      explicitlyConfirmed: true,
      decidedAt: changedAt,
      rationale: "Bewusst gesetzt.",
    });
    const prioritizedTask = prioritized.workspace.tasks[0];
    expect(prioritizedTask?.manualPriority).toMatchObject({ rank: 1, decidedBy: "sir" });

    const deleted = await service.moveTaskToTrash(prioritizedTask?.id ?? "", 3);
    expect(deleted.workspace.tasks).toEqual([]);
    expect(deleted.trash.tasks[0]).toMatchObject({ revision: 4, deletedAt: changedAt });

    const restored = await service.restoreTask(deleted.trash.tasks[0]?.id ?? "", 4);
    expect(restored.workspace.tasks[0]).toMatchObject({
      revision: 5,
      deletedAt: null,
      manualPriority: { rank: 1, decidedBy: "sir" },
    });
    expect(restored.auditEntries.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(["update", "delete", "restore"]),
    );
  });

  it("stores only acyclic dependencies between existing tasks", async () => {
    const initialized = await service.initialize();
    const rhia = initialized.workspace.areas.find((area) => area.name === "RHIA");
    if (!rhia) {
      throw new Error("Künstlicher RHIA-Testbereich fehlt.");
    }
    await storage.tasks.create(
      createTask(
        { areaId: rhia.id, title: "Vorarbeit", status: "planned" },
        { id: ids.taskOne, timestamp },
      ),
    );
    await storage.tasks.create(
      createTask(
        { areaId: rhia.id, title: "Folgearbeit", status: "planned" },
        { id: ids.taskTwo, timestamp },
      ),
    );

    const snapshot = await service.addDependency(ids.taskTwo, ids.taskOne);
    expect(snapshot.workspace.dependencies[0]).toMatchObject({
      taskId: ids.taskTwo,
      dependsOnTaskId: ids.taskOne,
    });
    await expect(service.addDependency(ids.taskOne, ids.taskTwo)).rejects.toMatchObject({
      code: "CYCLIC_TASK_DEPENDENCY",
    });
    await expect(storage.taskDependencies.list()).resolves.toHaveLength(1);
  });
});

describe("stage 3.8 confirmed task input", () => {
  it("does not persist an unconfirmed task and audits a confirmed task", async () => {
    const initialized = await service.initialize();
    const rhia = initialized.workspace.areas.find((area) => area.name === "RHIA");
    if (!rhia) {
      throw new Error("Künstlicher RHIA-Testbereich fehlt.");
    }
    const confirmation = {
      actor: "sir",
      explicitlyConfirmed: true,
      confirmedAt: changedAt,
    } as const;

    await expect(
      service.createConfirmedTask({ areaId: rhia.id, title: "Nicht übernehmen" }, {
        ...confirmation,
        explicitlyConfirmed: false,
      } as unknown as typeof confirmation),
    ).rejects.toMatchObject({ code: "TASK_INPUT_CONFIRMATION_REQUIRED" });
    await expect(storage.tasks.list()).resolves.toEqual([]);

    const snapshot = await service.createConfirmedTask(
      { areaId: rhia.id, title: "Ausdrücklich übernehmen" },
      confirmation,
    );

    expect(snapshot.workspace.tasks[0]).toMatchObject({
      title: "Ausdrücklich übernehmen",
      status: "inbox",
    });
    expect(
      snapshot.auditEntries.some(
        (entry) =>
          entry.entityType === "task" &&
          entry.action === "create" &&
          entry.summary === "Von Sir ausdrücklich bestätigte Aufgabeneingabe.",
      ),
    ).toBe(true);
  });
});
