import { describe, expect, it } from "vitest";
import {
  assertGoalProjectAssignment,
  assertTaskAssignment,
  assertTaskDependencyGraph,
  assertWorkHubAreaAssignment,
  clearManualTaskPriority,
  confirmDecisionProposal,
  confirmMemoryFactProposal,
  createArea,
  createAuditEntry,
  createConfirmedTask,
  createDecision,
  createGoal,
  createEveningReview,
  createMemoryConflict,
  createMemoryFact,
  createNote,
  createPlanningFeedback,
  createPlanningProposal,
  createProject,
  createSource,
  createTask,
  createTaskDependency,
  evaluateTaskPriority,
  getMissingWorkHubAreaNames,
  getTaskBlockState,
  RHIA_RUNTIME,
  RHIA_SCHEMA_VERSION,
  RHIA_STAGE,
  rankTasksByAutomaticPriority,
  rankTasksByPriority,
  revokeDecision,
  setManualTaskPriority,
  supersedeDecision,
  supersedeMemoryFact,
  TASK_STATUSES,
  WORK_HUB_AREA_NAMES,
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
  project: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  projectTwo: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  goal: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  goalTwo: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  taskOne: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  taskTwo: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  taskThree: "12345678-1234-4234-8234-123456789abc",
  dependencyOne: "23456789-2345-4345-8345-23456789abcd",
  dependencyTwo: "3456789a-3456-4456-8456-3456789abcde",
  dependencyThree: "456789ab-4567-4567-8567-456789abcdef",
  areaShadow: "56789abc-5678-4678-8678-56789abcdef0",
  areaPrivate: "6789abcd-6789-4789-8789-6789abcdef01",
} as const;

describe("RHIA stage 4 domain foundation", () => {
  it("activates IndexedDB as the only local source while cloud and AI stay disabled", () => {
    expect(RHIA_STAGE).toBe(4);
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

describe("stage 3.1 work hub domain", () => {
  const createWorkHubFixture = () => {
    const project = createProject(
      {
        areaId: ids.area,
        title: "RHIA 2.0",
        description: "Lokale Assistenz aufbauen.",
      },
      { id: ids.project, timestamp },
    );
    const goal = createGoal(
      {
        projectId: project.id,
        title: "Arbeitszentrale vorbereiten",
        targetAt: "2026-08-31T18:00:00.000Z",
      },
      { id: ids.goal, timestamp },
    );
    const taskOne = createTask(
      {
        areaId: ids.area,
        projectId: project.id,
        goalId: goal.id,
        title: "Domänenmodell definieren",
        dueAt: "2026-08-10T18:00:00.000Z",
        importance: "high",
        estimatedMinutes: 60,
        moneyImpact: "low",
        expectedIncomeCents: 10_000,
        expectedIncomeAt: "2026-09-01T12:00:00.000Z",
      },
      { id: ids.taskOne, timestamp },
    );
    const taskTwo = createTask(
      {
        areaId: ids.area,
        projectId: project.id,
        goalId: goal.id,
        title: "Verträge absichern",
        status: "planned",
      },
      { id: ids.taskTwo, timestamp },
    );
    const taskThree = createTask(
      {
        areaId: ids.area,
        projectId: project.id,
        title: "Tests ausführen",
        status: "blocked",
        blockedReason: "Verträge müssen zuerst vollständig sein.",
      },
      { id: ids.taskThree, timestamp },
    );

    return { project, goal, taskOne, taskTwo, taskThree };
  };

  it("creates Project, Goal, Task and TaskDependency with stable defaults", () => {
    const { project, goal, taskOne, taskTwo } = createWorkHubFixture();
    const dependency = createTaskDependency(
      { taskId: taskTwo.id, dependsOnTaskId: taskOne.id },
      { id: ids.dependencyOne, timestamp },
    );

    expect(project).toMatchObject({ type: "project", status: "active", areaId: ids.area });
    expect(goal).toMatchObject({ type: "goal", status: "planned", projectId: project.id });
    expect(taskOne).toMatchObject({
      type: "task",
      status: "inbox",
      importance: "high",
      manualPriority: null,
    });
    expect(taskTwo).toMatchObject({
      importance: "medium",
      estimatedMinutes: null,
      moneyImpact: "none",
      blockedReason: null,
    });
    expect(dependency).toMatchObject({
      type: "task-dependency",
      taskId: taskTwo.id,
      dependsOnTaskId: taskOne.id,
    });
    expect(TASK_STATUSES).toEqual([
      "inbox",
      "planned",
      "in-progress",
      "blocked",
      "completed",
      "discarded",
    ]);
  });

  it("does not accept an untrusted manual priority through the task factory", () => {
    const untrustedInput = {
      areaId: ids.area,
      title: "Nicht automatisch priorisieren",
      manualPriority: {
        rank: 1,
        decidedAt: timestamp,
        decidedBy: "sir",
        rationale: "Nicht ausdrücklich bestätigt.",
      },
    };

    expect(createTask(untrustedInput, { id: ids.taskOne, timestamp }).manualPriority).toBeNull();
  });

  it("rejects contradictory task fields before an invalid entity is created", () => {
    expect(() =>
      createTask(
        { areaId: ids.area, goalId: ids.goal, title: "Ziel ohne Projekt" },
        { id: ids.taskOne, timestamp },
      ),
    ).toThrow(expect.objectContaining({ code: "INVALID_TASK_ASSIGNMENT" }));

    expect(() =>
      createTask(
        { areaId: ids.area, title: "Blockiert ohne Grund", status: "blocked" },
        { id: ids.taskOne, timestamp },
      ),
    ).toThrow(expect.objectContaining({ code: "INVALID_TASK_BLOCK_STATE" }));

    expect(() =>
      createTask(
        {
          areaId: ids.area,
          title: "Kein Geldbezug",
          moneyImpact: "none",
          expectedIncomeCents: 10_000,
        },
        { id: ids.taskOne, timestamp },
      ),
    ).toThrow(expect.objectContaining({ code: "INVALID_TASK_INCOME" }));

    expect(() =>
      createTaskDependency(
        { taskId: ids.taskOne, dependsOnTaskId: ids.taskOne },
        { id: ids.dependencyOne, timestamp },
      ),
    ).toThrow(expect.objectContaining({ code: "INVALID_TASK_DEPENDENCY" }));
  });

  it("keeps project, goal and area assignments consistent", () => {
    const { project, goal, taskOne } = createWorkHubFixture();

    expect(() => assertGoalProjectAssignment(goal, project)).not.toThrow();
    expect(() => assertTaskAssignment(taskOne, project, goal)).not.toThrow();

    const otherProject = createProject(
      { areaId: ids.source, title: "Anderer Bereich" },
      { id: ids.projectTwo, timestamp },
    );
    const otherGoal = createGoal(
      { projectId: otherProject.id, title: "Anderes Ziel" },
      { id: ids.goalTwo, timestamp },
    );

    expect(() => assertGoalProjectAssignment(goal, otherProject)).toThrow(
      expect.objectContaining({ code: "INVALID_TASK_ASSIGNMENT" }),
    );
    expect(() => assertTaskAssignment(taskOne, otherProject, goal)).toThrow(
      expect.objectContaining({ code: "INVALID_TASK_ASSIGNMENT" }),
    );
    expect(() => assertTaskAssignment(taskOne, project, otherGoal)).toThrow(
      expect.objectContaining({ code: "INVALID_TASK_ASSIGNMENT" }),
    );
  });

  it("accepts an inbox task without a project or goal assignment", () => {
    const inboxTask = createTask(
      { areaId: ids.area, title: "Unsortierter Eingang" },
      { id: ids.taskOne, timestamp },
    );

    expect(inboxTask).toMatchObject({ status: "inbox", projectId: null, goalId: null });
    expect(() => assertTaskAssignment(inboxTask, null, null)).not.toThrow();
  });

  it("accepts an acyclic graph and rejects missing, duplicate or cyclic dependencies", () => {
    const { taskOne, taskTwo, taskThree } = createWorkHubFixture();
    const dependencyOne = createTaskDependency(
      { taskId: taskTwo.id, dependsOnTaskId: taskOne.id },
      { id: ids.dependencyOne, timestamp },
    );
    const dependencyTwo = createTaskDependency(
      { taskId: taskThree.id, dependsOnTaskId: taskTwo.id },
      { id: ids.dependencyTwo, timestamp },
    );
    const duplicate = createTaskDependency(
      { taskId: taskTwo.id, dependsOnTaskId: taskOne.id },
      { id: ids.dependencyThree, timestamp },
    );
    const cycle = createTaskDependency(
      { taskId: taskOne.id, dependsOnTaskId: taskThree.id },
      { id: ids.dependencyThree, timestamp },
    );

    expect(() =>
      assertTaskDependencyGraph([taskOne, taskTwo, taskThree], [dependencyOne, dependencyTwo]),
    ).not.toThrow();
    expect(() =>
      assertTaskDependencyGraph([taskOne, taskTwo, taskThree], [dependencyOne, duplicate]),
    ).toThrow(expect.objectContaining({ code: "DUPLICATE_TASK_DEPENDENCY" }));
    expect(() =>
      assertTaskDependencyGraph(
        [taskOne, taskTwo, taskThree],
        [dependencyOne, dependencyTwo, cycle],
      ),
    ).toThrow(expect.objectContaining({ code: "CYCLIC_TASK_DEPENDENCY" }));
    expect(() => assertTaskDependencyGraph([taskOne], [dependencyOne])).toThrow(
      expect.objectContaining({ code: "INVALID_TASK_DEPENDENCY" }),
    );
  });
});

describe("stage 3.2 required work hub areas", () => {
  it("defines the four required areas in their binding order", () => {
    expect(WORK_HUB_AREA_NAMES).toEqual(["Privat", "RH Produktion", "RHIA", "Shadow Grown"]);
  });

  it("reports only missing active required areas and preserves custom areas", () => {
    const rhia = createArea({ name: "RHIA" }, { id: ids.area, timestamp });
    const archivedPrivate = createArea(
      { name: "Privat", status: "archived" },
      { id: ids.project, timestamp },
    );
    const custom = createArea({ name: "Zusätzlicher Bereich" }, { id: ids.projectTwo, timestamp });

    expect(getMissingWorkHubAreaNames([rhia, archivedPrivate, custom])).toEqual([
      "Privat",
      "RH Produktion",
      "Shadow Grown",
    ]);
  });

  it("accepts only the matching active required area for work hub assignments", () => {
    const rhia = createArea({ name: "RHIA" }, { id: ids.area, timestamp });
    const custom = createArea({ name: "Zusätzlicher Bereich" }, { id: ids.project, timestamp });

    expect(() => assertWorkHubAreaAssignment(rhia.id, rhia)).not.toThrow();
    expect(() => assertWorkHubAreaAssignment(ids.project, rhia)).toThrowError(
      expect.objectContaining({ code: "INVALID_WORK_HUB_AREA" }),
    );
    expect(() => assertWorkHubAreaAssignment(custom.id, custom)).toThrowError(
      expect.objectContaining({ code: "INVALID_WORK_HUB_AREA" }),
    );
    expect(() =>
      assertWorkHubAreaAssignment(rhia.id, { ...rhia, status: "archived" }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_WORK_HUB_AREA" }));
    expect(() => assertWorkHubAreaAssignment(rhia.id, null)).toThrowError(
      expect.objectContaining({ code: "INVALID_WORK_HUB_AREA" }),
    );
  });
});

describe("stage 3.3 structured task fields and blockages", () => {
  it("derives a visible dependency blockage until every prerequisite is completed", () => {
    const task = createTask(
      {
        areaId: ids.area,
        title: "Arbeitszentrale veröffentlichen",
        status: "planned",
        dueAt: "2026-08-12T18:00:00.000Z",
        importance: "high",
        estimatedMinutes: 90,
        moneyImpact: "medium",
        expectedIncomeCents: 25_000,
        expectedIncomeAt: "2026-09-01T12:00:00.000Z",
      },
      { id: ids.taskOne, timestamp },
    );
    const prerequisite = createTask(
      { areaId: ids.area, title: "Abnahme durchführen", status: "in-progress" },
      { id: ids.taskTwo, timestamp },
    );
    const dependency = createTaskDependency(
      { taskId: task.id, dependsOnTaskId: prerequisite.id },
      { id: ids.dependencyOne, timestamp },
    );

    expect(getTaskBlockState(task, [task, prerequisite], [dependency])).toEqual({
      blocked: true,
      kind: "dependency",
      blockedReason: null,
      blockedByTaskIds: [prerequisite.id],
      explanation: "1 abhängige Aufgaben sind noch nicht erledigt.",
    });
    expect(
      getTaskBlockState(task, [task, { ...prerequisite, status: "completed" }], [dependency]),
    ).toMatchObject({ blocked: false, kind: "none", blockedByTaskIds: [] });
  });

  it("combines an explicit blockage with unresolved dependencies", () => {
    const task = createTask(
      {
        areaId: ids.area,
        title: "Arbeitszentrale testen",
        status: "blocked",
        blockedReason: "Gerätetest fehlt.",
      },
      { id: ids.taskOne, timestamp },
    );
    const prerequisite = createTask(
      { areaId: ids.area, title: "Testdaten vorbereiten", status: "planned" },
      { id: ids.taskTwo, timestamp },
    );
    const dependency = createTaskDependency(
      { taskId: task.id, dependsOnTaskId: prerequisite.id },
      { id: ids.dependencyOne, timestamp },
    );

    expect(getTaskBlockState(task, [task, prerequisite], [dependency])).toMatchObject({
      blocked: true,
      kind: "explicit-and-dependency",
      blockedReason: "Gerätetest fehlt.",
      blockedByTaskIds: [prerequisite.id],
    });
  });
});

describe("stage 3.4 explainable automatic priority", () => {
  it("orders deadline and importance before later priority factors", () => {
    const urgent = createTask(
      {
        areaId: ids.area,
        title: "Heute abgeben",
        status: "planned",
        dueAt: "2026-08-09T12:00:00.000Z",
        importance: "high",
        estimatedMinutes: 60,
      },
      { id: ids.taskOne, timestamp },
    );
    const profitable = createTask(
      {
        areaId: ids.source,
        title: "Späterer Umsatz",
        status: "planned",
        importance: "medium",
        moneyImpact: "high",
        expectedIncomeCents: 100_000,
        expectedIncomeAt: "2026-08-12T12:00:00.000Z",
      },
      { id: ids.taskTwo, timestamp },
    );

    const ranked = rankTasksByAutomaticPriority([profitable, urgent], [], {
      now: "2026-08-09T10:00:00.000Z",
      availableMinutes: 90,
    });

    expect(ranked.map((entry) => entry.taskId)).toEqual([urgent.id, profitable.id]);
    expect(ranked[0]?.factors.map((factor) => factor.key)).toEqual([
      "deadline",
      "importance",
      "blockage",
      "money-impact",
      "income-timing",
      "effort-fit",
      "protected-work",
    ]);
    expect(ranked[0]?.explanation).toContain("Frist liegt innerhalb von 24 Stunden");
  });

  it("makes blockages, income timing, effort fit and protected work visible", () => {
    const task = createTask(
      {
        areaId: ids.area,
        title: "Geschütztes Projekt fortsetzen",
        status: "planned",
        importance: "high",
        estimatedMinutes: 45,
        moneyImpact: "medium",
        expectedIncomeCents: 30_000,
        expectedIncomeAt: "2026-08-15T12:00:00.000Z",
      },
      { id: ids.taskOne, timestamp },
    );
    const blocker = createTask(
      { areaId: ids.area, title: "Vorarbeit", status: "in-progress" },
      { id: ids.taskTwo, timestamp },
    );
    const dependency = createTaskDependency(
      { taskId: task.id, dependsOnTaskId: blocker.id },
      { id: ids.dependencyOne, timestamp },
    );

    const result = evaluateTaskPriority(task, [task, blocker], [dependency], {
      now: "2026-08-09T10:00:00.000Z",
      availableMinutes: 60,
      protectedAreaIds: [ids.area],
    });

    expect(result).toMatchObject({ blocked: true, blockedByTaskIds: [blocker.id] });
    expect(result.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "blockage", points: -500 }),
        expect.objectContaining({ key: "income-timing", points: 120 }),
        expect.objectContaining({ key: "effort-fit", points: 90 }),
        expect.objectContaining({ key: "protected-work", points: 35 }),
      ]),
    );
  });

  it("rejects invalid priority context and excludes completed work from active ranking", () => {
    const task = createTask(
      { areaId: ids.area, title: "Abgeschlossen", status: "completed" },
      { id: ids.taskOne, timestamp },
    );

    expect(() =>
      evaluateTaskPriority(task, [task], [], { now: "ungültig", availableMinutes: 0 }),
    ).toThrow(expect.objectContaining({ code: "INVALID_TASK_PRIORITY_CONTEXT" }));
    expect(
      evaluateTaskPriority(task, [task], [], { now: "2026-08-09T10:00:00.000Z" }),
    ).toMatchObject({ score: -10_000, blocked: false });
  });
});

describe("stage 3.5 protected manual priority", () => {
  const decision = {
    actor: "sir",
    explicitlyConfirmed: true,
    decidedAt: "2026-08-09T11:00:00.000Z",
    rationale: "Diese Aufgabe kommt bewusst zuerst.",
  } as const;

  it("sets and clears manual priority only after an explicit decision by Sir", () => {
    const task = createTask(
      { areaId: ids.area, title: "Bewusst vorziehen", status: "planned" },
      { id: ids.taskOne, timestamp },
    );
    const prioritized = setManualTaskPriority(task, 1, decision);

    expect(prioritized.manualPriority).toEqual({
      rank: 1,
      decidedAt: decision.decidedAt,
      decidedBy: "sir",
      rationale: decision.rationale,
    });
    expect(() =>
      setManualTaskPriority(task, 1, {
        ...decision,
        explicitlyConfirmed: false,
      } as unknown as typeof decision),
    ).toThrow(expect.objectContaining({ code: "MANUAL_TASK_PRIORITY_CONFIRMATION_REQUIRED" }));
    expect(clearManualTaskPriority(prioritized, decision).manualPriority).toBeNull();
  });

  it("keeps Sir's chosen rank when automatic scores are recalculated", () => {
    const automaticFirst = createTask(
      {
        areaId: ids.area,
        title: "Automatisch dringend",
        status: "planned",
        dueAt: "2026-08-09T12:00:00.000Z",
        importance: "high",
      },
      { id: ids.taskOne, timestamp },
    );
    const manualSecond = setManualTaskPriority(
      createTask(
        { areaId: ids.area, title: "Manuell auf Rang zwei", status: "planned" },
        { id: ids.taskTwo, timestamp },
      ),
      2,
      decision,
    );
    const automaticThird = createTask(
      { areaId: ids.area, title: "Automatisch dahinter", status: "planned", importance: "low" },
      { id: ids.taskThree, timestamp },
    );

    const ranked = rankTasksByPriority([automaticThird, manualSecond, automaticFirst], [], {
      now: "2026-08-09T10:00:00.000Z",
    });

    expect(ranked.map((entry) => [entry.taskId, entry.rank, entry.source])).toEqual([
      [automaticFirst.id, 1, "automatic"],
      [manualSecond.id, 2, "manual"],
      [automaticThird.id, 3, "automatic"],
    ]);
    expect(ranked[1]?.explanation).toContain("Manuelle Priorität von Sir: Rang 2");
    expect(manualSecond.manualPriority?.rank).toBe(2);
  });
});

describe("stage 3.8 confirmed task acceptance", () => {
  it("creates a real task only after explicit confirmation by Sir", () => {
    const confirmation = {
      actor: "sir",
      explicitlyConfirmed: true,
      confirmedAt: "2026-08-09T11:00:00.000Z",
    } as const;

    expect(
      createConfirmedTask({ areaId: ids.area, title: "Bestätigte Aufgabe" }, confirmation, {
        id: ids.taskOne,
        timestamp,
      }),
    ).toMatchObject({ id: ids.taskOne, title: "Bestätigte Aufgabe", status: "inbox" });
    expect(() =>
      createConfirmedTask(
        { areaId: ids.area, title: "Unbestätigte Aufgabe" },
        { ...confirmation, explicitlyConfirmed: false } as unknown as typeof confirmation,
        { id: ids.taskTwo, timestamp },
      ),
    ).toThrow(expect.objectContaining({ code: "TASK_INPUT_CONFIRMATION_REQUIRED" }));
    expect(() =>
      createConfirmedTask(
        { areaId: ids.area, title: "Zu früh bestätigt" },
        { ...confirmation, confirmedAt: "2026-08-08T07:59:59.000Z" },
        { id: ids.taskTwo, timestamp },
      ),
    ).toThrow(expect.objectContaining({ code: "TASK_INPUT_CONFIRMATION_REQUIRED" }));
  });
});

describe("stage 4 deterministic planning and briefings", () => {
  const rhiaArea = createArea(
    { name: "RHIA" },
    { id: ids.area, timestamp: "2026-08-10T07:00:00.000Z" },
  );
  const shadowArea = createArea(
    { name: "Shadow Grown" },
    { id: ids.areaShadow, timestamp: "2026-08-10T07:00:00.000Z" },
  );
  const privateArea = createArea(
    { name: "Privat" },
    { id: ids.areaPrivate, timestamp: "2026-08-10T07:00:00.000Z" },
  );

  it("reserves about twenty percent and at least sixty minutes for each protected weekly area", () => {
    const urgent = createTask(
      {
        areaId: privateArea.id,
        title: "Künstliche Fristaufgabe",
        status: "planned",
        dueAt: "2026-08-11T12:00:00.000Z",
        importance: "high",
        estimatedMinutes: 60,
      },
      { id: ids.taskOne, timestamp: "2026-08-10T07:00:00.000Z" },
    );
    const proposal = createPlanningProposal(
      {
        kind: "week",
        periodStart: "2026-08-10T00:00:00.000Z",
        periodEnd: "2026-08-17T00:00:00.000Z",
        generatedAt: "2026-08-10T08:00:00.000Z",
        availability: Array.from({ length: 5 }, (_, index) => ({
          startAt: `2026-08-${String(10 + index).padStart(2, "0")}T18:00:00.000Z`,
          endAt: `2026-08-${String(10 + index).padStart(2, "0")}T20:00:00.000Z`,
        })),
      },
      {
        areas: [rhiaArea, shadowArea, privateArea],
        tasks: [urgent],
        dependencies: [],
        workBlocks: [],
        feedback: [],
      },
    );

    const protection = proposal.workBlocks.filter((block) => block.kind === "protection");
    expect(proposal.briefing).toMatchObject({
      kind: "week",
      availableMinutes: 600,
      protectionMinutes: 120,
    });
    expect(
      protection
        .filter((block) => block.areaId === rhiaArea.id)
        .reduce((sum, block) => sum + block.durationMinutes, 0),
    ).toBe(60);
    expect(
      protection
        .filter((block) => block.areaId === shadowArea.id)
        .reduce((sum, block) => sum + block.durationMinutes, 0),
    ).toBe(60);
    expect(proposal.workBlocks.some((block) => block.taskId === urgent.id)).toBe(true);
    expect(proposal.briefing.explanation).toContain("Fristen");
  });

  it("uses partial time feedback to enlarge the next task block", () => {
    const task = createTask(
      {
        areaId: privateArea.id,
        title: "Künstlicher Feedback-Test",
        status: "planned",
        estimatedMinutes: 60,
      },
      { id: ids.taskOne, timestamp: "2026-08-10T07:00:00.000Z" },
    );
    const first = createPlanningProposal(
      {
        kind: "morning",
        periodStart: "2026-08-10T00:00:00.000Z",
        periodEnd: "2026-08-11T00:00:00.000Z",
        generatedAt: "2026-08-10T08:00:00.000Z",
        availability: [{ startAt: "2026-08-10T09:00:00.000Z", endAt: "2026-08-10T12:00:00.000Z" }],
      },
      {
        areas: [rhiaArea, shadowArea, privateArea],
        tasks: [task],
        dependencies: [],
        workBlocks: [],
        feedback: [],
      },
    );
    const firstTaskBlock = first.workBlocks.find((block) => block.taskId === task.id);
    expect(firstTaskBlock?.durationMinutes).toBe(60);
    if (!firstTaskBlock) {
      throw new Error("Künstlicher Aufgabenblock fehlt.");
    }
    const feedback = createPlanningFeedback({
      briefingId: first.briefing.id,
      workBlockId: firstTaskBlock.id,
      taskId: task.id,
      result: "partial",
      reason: "time-too-short",
      actualMinutes: 30,
      recordedBy: "sir",
      recordedAt: "2026-08-10T18:00:00.000Z",
    });
    const followUp = createPlanningProposal(
      {
        kind: "morning",
        periodStart: "2026-08-11T00:00:00.000Z",
        periodEnd: "2026-08-12T00:00:00.000Z",
        generatedAt: "2026-08-11T08:00:00.000Z",
        availability: [{ startAt: "2026-08-11T09:00:00.000Z", endAt: "2026-08-11T13:00:00.000Z" }],
      },
      {
        areas: [rhiaArea, shadowArea, privateArea],
        tasks: [task],
        dependencies: [],
        workBlocks: first.workBlocks,
        feedback: [feedback],
      },
    );

    const followUpBlock = followUp.workBlocks.find((block) => block.taskId === task.id);
    expect(followUpBlock?.durationMinutes).toBe(90);
    expect(followUpBlock?.explanation).toContain("Letzte Rückmeldung: partial");
  });

  it("creates an evening review and rejects a week without enough protection time", () => {
    expect(() =>
      createPlanningProposal(
        {
          kind: "week",
          periodStart: "2026-08-10T00:00:00.000Z",
          periodEnd: "2026-08-17T00:00:00.000Z",
          generatedAt: "2026-08-10T08:00:00.000Z",
          availability: [
            { startAt: "2026-08-10T09:00:00.000Z", endAt: "2026-08-10T10:30:00.000Z" },
          ],
        },
        {
          areas: [rhiaArea, shadowArea],
          tasks: [],
          dependencies: [],
          workBlocks: [],
          feedback: [],
        },
      ),
    ).toThrow(expect.objectContaining({ code: "INSUFFICIENT_WEEKLY_PROTECTION_TIME" }));

    const review = createEveningReview({
      periodStart: "2026-08-10T00:00:00.000Z",
      periodEnd: "2026-08-11T00:00:00.000Z",
      generatedAt: "2026-08-10T20:00:00.000Z",
      workBlocks: [],
      feedback: [],
    });
    expect(review).toMatchObject({
      kind: "evening",
      summary: "0 erledigt, 0 teilweise, 0 ausgelassen, 0 ohne Rückmeldung.",
    });
  });
});
