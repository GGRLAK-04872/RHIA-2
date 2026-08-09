import { describe, expect, it } from "vitest";
import {
  RHIA_RUNTIME,
  RHIA_SCHEMA_VERSION,
  RHIA_STAGE,
  TASK_STATUSES,
  assertGoalProjectAssignment,
  assertTaskAssignment,
  assertTaskDependencyGraph,
  confirmDecisionProposal,
  confirmMemoryFactProposal,
  createArea,
  createAuditEntry,
  createDecision,
  createGoal,
  createMemoryConflict,
  createMemoryFact,
  createNote,
  createProject,
  createSource,
  createTask,
  createTaskDependency,
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
} as const;

describe("RHIA stage 2 domain foundation", () => {
  it("activates IndexedDB as the only local source while cloud and AI stay disabled", () => {
    expect(RHIA_STAGE).toBe(2);
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
