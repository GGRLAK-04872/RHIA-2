import {
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
} from "@rhia/domain";
import { describe, expect, it } from "vitest";
import {
  activeWorkHubAreaSchema,
  appStatusSchema,
  areaSchema,
  auditEntrySchema,
  decisionSchema,
  explicitTaskInputConfirmationSchema,
  explicitTaskPriorityDecisionSchema,
  goalSchema,
  manualTaskPrioritySchema,
  memoryConflictSchema,
  memoryFactSchema,
  noteSchema,
  persistedEntitySchema,
  projectSchema,
  sourceSchema,
  taskDependencySchema,
  taskSchema,
  workHubAreaNameSchema,
} from "./index";

const timestamp = "2026-08-08T16:00:00.000Z";
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
  goal: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  taskOne: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  taskTwo: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  dependency: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
} as const;

describe("stage 1 contracts", () => {
  it("validates Area, Source, Note and AuditEntry", () => {
    const area = createArea({ name: "RHIA" }, { id: ids.area, timestamp });
    const source = createSource(
      { kind: "manual", label: "Direkte Eingabe" },
      { id: ids.source, timestamp },
    );
    const note = createNote(
      { areaId: area.id, sourceId: source.id, title: "Test", body: "Inhalt" },
      { id: ids.note, timestamp },
    );
    const audit = createAuditEntry(
      { entityType: note.type, entityId: note.id, entityRevision: 1, action: "create" },
      { id: ids.audit, timestamp },
    );

    expect(areaSchema.parse(area)).toEqual(area);
    expect(sourceSchema.parse(source)).toEqual(source);
    expect(noteSchema.parse(note)).toEqual(note);
    expect(auditEntrySchema.parse(audit)).toEqual(audit);
    expect(
      [area, source, note, audit].every(
        (entity) => persistedEntitySchema.safeParse(entity).success,
      ),
    ).toBe(true);
  });

  it("rejects invalid IDs and impossible timelines", () => {
    const area = createArea(
      { name: "RHIA" },
      { id: ids.area, timestamp: "2026-08-08T16:00:00.000Z" },
    );

    expect(areaSchema.safeParse({ ...area, id: "not-a-uuid" }).success).toBe(false);
    expect(areaSchema.safeParse({ ...area, updatedAt: "2026-08-08T15:59:59.000Z" }).success).toBe(
      false,
    );
  });

  it("permits only local-first, API-disabled persisted stage status", () => {
    expect(
      appStatusSchema.safeParse({
        version: "0.2.0",
        stage: 1,
        mode: "local-first",
        apiEnabled: false,
        persistenceEnabled: true,
      }).success,
    ).toBe(true);

    expect(
      appStatusSchema.safeParse({
        version: "0.2.0",
        stage: 1,
        mode: "local-first",
        apiEnabled: true,
        persistenceEnabled: true,
      }).success,
    ).toBe(false);

    expect(
      appStatusSchema.safeParse({
        version: "0.3.0",
        stage: 3,
        mode: "local-first",
        apiEnabled: false,
        persistenceEnabled: true,
      }).success,
    ).toBe(true);

    expect(
      appStatusSchema.safeParse({
        version: "0.3.0",
        stage: 3,
        mode: "local-first",
        apiEnabled: true,
        persistenceEnabled: true,
      }).success,
    ).toBe(false);

    expect(
      appStatusSchema.safeParse({
        version: "0.2.0",
        stage: 2,
        mode: "local-first",
        apiEnabled: false,
        persistenceEnabled: true,
      }).success,
    ).toBe(true);
  });
});

describe("stage 2 memory contracts", () => {
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

  it("validates proposed memory records without activating them", () => {
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
    const conflictingFact = createMemoryFact(
      {
        areaId: ids.area,
        sourceIds: [ids.source],
        knowledgeType: "profile",
        subject: "sir",
        predicate: "preferred-address",
        value: "Mike",
        conflictKey: proposedFact.conflictKey,
        displayText: "Die bevorzugte Anrede ist Mike.",
      },
      { id: ids.factTwo, timestamp, originDeviceId: ids.device },
    );
    const conflict = createMemoryConflict(
      {
        areaId: ids.area,
        conflictKey: proposedFact.conflictKey,
        factIds: [proposedFact.id, conflictingFact.id],
      },
      { id: ids.conflict, timestamp, originDeviceId: ids.device },
    );

    expect(memoryFactSchema.parse(proposedFact)).toEqual(proposedFact);
    expect(decisionSchema.parse(decision)).toEqual(decision);
    expect(memoryConflictSchema.parse(conflict)).toEqual(conflict);
    expect(
      [proposedFact, decision, conflict].every(
        (entity) => persistedEntitySchema.safeParse(entity).success,
      ),
    ).toBe(true);
  });

  it("requires explicit confirmation for confirmed facts and decisions", () => {
    expect(memoryFactSchema.safeParse({ ...proposedFact, status: "confirmed" }).success).toBe(
      false,
    );
    expect(
      memoryFactSchema.safeParse({
        ...proposedFact,
        status: "confirmed",
        confirmedAt: timestamp,
        confirmedBy: "sir",
      }).success,
    ).toBe(true);
    expect(
      memoryFactSchema.safeParse({
        ...proposedFact,
        status: "confirmed",
        confirmedAt: "2026-08-08T15:59:59.000Z",
        confirmedBy: "sir",
      }).success,
    ).toBe(false);
    expect(memoryFactSchema.safeParse({ ...proposedFact, status: "disputed" }).success).toBe(false);

    const decision = createDecision(
      {
        areaId: ids.area,
        sourceIds: [ids.source],
        title: "Lokale Entscheidung",
        decisionText: "Die Daten bleiben lokal.",
        rationale: "Eine Quelle der Wahrheit.",
      },
      { id: ids.decision, timestamp, originDeviceId: ids.device },
    );
    expect(decisionSchema.safeParse({ ...decision, status: "confirmed" }).success).toBe(false);
    expect(
      decisionSchema.safeParse({
        ...decision,
        status: "confirmed",
        confirmedAt: timestamp,
        confirmedBy: "sir",
      }).success,
    ).toBe(true);
  });

  it("rejects unstable keys, impossible validity and contradictory deletion states", () => {
    expect(
      memoryFactSchema.safeParse({ ...proposedFact, conflictKey: "Nicht Stabil" }).success,
    ).toBe(false);
    expect(
      memoryFactSchema.safeParse({
        ...proposedFact,
        validFrom: "2026-08-09T12:00:00.000Z",
        validUntil: "2026-08-09T11:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(memoryFactSchema.safeParse({ ...proposedFact, status: "deleted" }).success).toBe(false);
  });

  it("keeps conflicts open until Sir supplies a complete resolution", () => {
    const conflict = createMemoryConflict(
      {
        areaId: ids.area,
        conflictKey: proposedFact.conflictKey,
        factIds: [ids.factOne, ids.factTwo],
      },
      { id: ids.conflict, timestamp, originDeviceId: ids.device },
    );

    expect(
      memoryConflictSchema.safeParse({
        ...conflict,
        resolvedAt: timestamp,
      }).success,
    ).toBe(false);
    expect(
      memoryConflictSchema.safeParse({
        ...conflict,
        status: "resolved",
        resolution: "keep-fact",
      }).success,
    ).toBe(false);
    expect(
      memoryConflictSchema.safeParse({
        ...conflict,
        status: "resolved",
        resolvedAt: timestamp,
        resolvedBy: "sir",
        resolution: "keep-fact",
        resolvedFactId: ids.factOne,
      }).success,
    ).toBe(true);
    expect(
      memoryConflictSchema.safeParse({
        ...conflict,
        status: "dismissed",
        resolvedAt: timestamp,
        resolvedBy: "sir",
        resolution: "not-a-conflict",
      }).success,
    ).toBe(true);
    expect(
      memoryConflictSchema.safeParse({
        ...conflict,
        status: "resolved",
        resolvedAt: timestamp,
        resolvedBy: "sir",
        resolution: "not-a-conflict",
      }).success,
    ).toBe(false);
    expect(
      memoryConflictSchema.safeParse({ ...conflict, factIds: [ids.factOne, ids.factOne] }).success,
    ).toBe(false);
  });
});

describe("stage 3.1 work hub contracts", () => {
  const project = createProject(
    { areaId: ids.area, title: "RHIA 2.0" },
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
  const task = createTask(
    {
      areaId: ids.area,
      projectId: project.id,
      goalId: goal.id,
      title: "Domänenmodell definieren",
      status: "blocked",
      blockedReason: "Verträge müssen zuerst feststehen.",
      dueAt: "2026-08-10T18:00:00.000Z",
      importance: "high",
      estimatedMinutes: 60,
      moneyImpact: "medium",
      expectedIncomeCents: 25_000,
      expectedIncomeAt: "2026-09-01T12:00:00.000Z",
    },
    { id: ids.taskOne, timestamp },
  );
  const prerequisite = createTask(
    { areaId: ids.area, projectId: project.id, title: "Verträge definieren" },
    { id: ids.taskTwo, timestamp },
  );
  const dependency = createTaskDependency(
    { taskId: task.id, dependsOnTaskId: prerequisite.id },
    { id: ids.dependency, timestamp },
  );

  it("validates all four work hub entities as strict persisted records", () => {
    expect(projectSchema.parse(project)).toEqual(project);
    expect(goalSchema.parse(goal)).toEqual(goal);
    expect(taskSchema.parse(task)).toEqual(task);
    expect(taskDependencySchema.parse(dependency)).toEqual(dependency);
    expect(
      [project, goal, task, dependency].every(
        (entity) => persistedEntitySchema.safeParse(entity).success,
      ),
    ).toBe(true);
    expect(projectSchema.safeParse({ ...project, unexpected: true }).success).toBe(false);
  });

  it("rejects incomplete assignments, block states and income data", () => {
    expect(taskSchema.safeParse({ ...task, projectId: null }).success).toBe(false);
    expect(taskSchema.safeParse({ ...task, blockedReason: null }).success).toBe(false);
    expect(
      taskSchema.safeParse({
        ...task,
        status: "planned",
        blockedReason: "Alter Blockadegrund",
      }).success,
    ).toBe(false);
    expect(
      taskSchema.safeParse({
        ...task,
        moneyImpact: "none",
      }).success,
    ).toBe(false);
    expect(
      taskSchema.safeParse({
        ...task,
        expectedIncomeCents: null,
      }).success,
    ).toBe(false);
    expect(taskSchema.safeParse({ ...task, estimatedMinutes: 0 }).success).toBe(false);
  });

  it("reserves manual priority for a complete explicit decision by Sir", () => {
    const manualPriority = {
      rank: 1,
      decidedAt: "2026-08-08T16:05:00.000Z",
      decidedBy: "sir",
      rationale: "Ausdrückliche Entscheidung von Sir.",
    } as const;

    expect(manualTaskPrioritySchema.parse(manualPriority)).toEqual(manualPriority);
    expect(taskSchema.safeParse({ ...task, manualPriority }).success).toBe(true);
    expect(
      taskSchema.safeParse({
        ...task,
        manualPriority: { ...manualPriority, decidedBy: "rhia" },
      }).success,
    ).toBe(false);
    expect(
      taskSchema.safeParse({
        ...task,
        manualPriority: { ...manualPriority, decidedAt: "2026-08-08T15:59:59.000Z" },
      }).success,
    ).toBe(false);
  });

  it("rejects self-dependencies and malformed relationship identifiers", () => {
    expect(
      taskDependencySchema.safeParse({ ...dependency, dependsOnTaskId: dependency.taskId }).success,
    ).toBe(false);
    expect(taskDependencySchema.safeParse({ ...dependency, taskId: "not-a-uuid" }).success).toBe(
      false,
    );
    expect(goalSchema.safeParse({ ...goal, projectId: "not-a-uuid" }).success).toBe(false);
  });
});

describe("stage 3.2 required work hub area contracts", () => {
  it("accepts exactly the four binding work hub area names", () => {
    for (const name of ["Privat", "RH Produktion", "RHIA", "Shadow Grown"] as const) {
      expect(workHubAreaNameSchema.parse(name)).toBe(name);
    }

    expect(workHubAreaNameSchema.safeParse("Allgemein").success).toBe(false);
    expect(workHubAreaNameSchema.safeParse("Rhia").success).toBe(false);
  });

  it("requires a work hub area to be active and not deleted", () => {
    const area = createArea({ name: "RHIA" }, { id: ids.area, timestamp });

    expect(activeWorkHubAreaSchema.parse(area)).toEqual(area);
    expect(activeWorkHubAreaSchema.safeParse({ ...area, name: "Allgemein" }).success).toBe(false);
    expect(activeWorkHubAreaSchema.safeParse({ ...area, status: "archived" }).success).toBe(false);
    expect(activeWorkHubAreaSchema.safeParse({ ...area, deletedAt: timestamp }).success).toBe(
      false,
    );
  });
});

describe("stage 3.5 manual priority decision contract", () => {
  it("accepts only an explicit strict decision by Sir", () => {
    const decision = {
      actor: "sir",
      explicitlyConfirmed: true,
      decidedAt: "2026-08-09T11:00:00.000Z",
      rationale: "Bewusst zuerst.",
    } as const;

    expect(explicitTaskPriorityDecisionSchema.parse(decision)).toEqual(decision);
    expect(
      explicitTaskPriorityDecisionSchema.safeParse({ ...decision, actor: "rhia" }).success,
    ).toBe(false);
    expect(
      explicitTaskPriorityDecisionSchema.safeParse({ ...decision, explicitlyConfirmed: false })
        .success,
    ).toBe(false);
    expect(
      explicitTaskPriorityDecisionSchema.safeParse({ ...decision, unexpected: true }).success,
    ).toBe(false);
  });
});

describe("stage 3.8 task input confirmation contract", () => {
  it("accepts only a strict explicit confirmation by Sir", () => {
    const confirmation = {
      actor: "sir",
      explicitlyConfirmed: true,
      confirmedAt: "2026-08-09T11:00:00.000Z",
    } as const;

    expect(explicitTaskInputConfirmationSchema.parse(confirmation)).toEqual(confirmation);
    expect(
      explicitTaskInputConfirmationSchema.safeParse({
        ...confirmation,
        explicitlyConfirmed: false,
      }).success,
    ).toBe(false);
    expect(
      explicitTaskInputConfirmationSchema.safeParse({ ...confirmation, actor: "rhia" }).success,
    ).toBe(false);
    expect(
      explicitTaskInputConfirmationSchema.safeParse({ ...confirmation, unexpected: true }).success,
    ).toBe(false);
  });
});
