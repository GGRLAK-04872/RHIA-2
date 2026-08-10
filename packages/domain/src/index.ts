export const RHIA_PRODUCT_NAME = "RHIA 2.0" as const;
export const RHIA_VERSION = "0.3.0" as const;
export const RHIA_STAGE = 3 as const;
export const RHIA_SCHEMA_VERSION = 1 as const;

export const RHIA_RUNTIME = {
  sourceOfTruth: "indexeddb",
  cloudRuntime: false,
  externalAi: false,
  persistence: true,
} as const;

export type RhiaRuntime = typeof RHIA_RUNTIME;

export const ENTITY_TYPES = [
  "area",
  "source",
  "note",
  "audit-entry",
  "memory-fact",
  "decision",
  "memory-conflict",
  "project",
  "goal",
  "task",
  "task-dependency",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface EntityBase<TType extends EntityType> {
  id: string;
  type: TType;
  schemaVersion: typeof RHIA_SCHEMA_VERSION;
  revision: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type AreaStatus = "active" | "archived";

export interface Area extends EntityBase<"area"> {
  name: string;
  description: string | null;
  status: AreaStatus;
}

export const WORK_HUB_AREA_NAMES = ["Privat", "RH Produktion", "RHIA", "Shadow Grown"] as const;
export type WorkHubAreaName = (typeof WORK_HUB_AREA_NAMES)[number];

export type ActiveWorkHubArea = Area & {
  name: WorkHubAreaName;
  status: "active";
  deletedAt: null;
};

export type SourceKind = "manual" | "import" | "system";

export interface Source extends EntityBase<"source"> {
  kind: SourceKind;
  label: string;
  reference: string | null;
}

export type NoteStatus = "active" | "archived";

export interface Note extends EntityBase<"note"> {
  areaId: string;
  sourceId: string | null;
  title: string;
  body: string;
  status: NoteStatus;
}

export type AuditAction = "create" | "update" | "delete" | "restore" | "purge";

export interface AuditEntry extends EntityBase<"audit-entry"> {
  entityType: EntityType;
  entityId: string;
  entityRevision: number;
  action: AuditAction;
  occurredAt: string;
  summary: string | null;
}

export type MemoryConfirmationActor = "sir";
export type MemoryFactStatus = "proposed" | "confirmed" | "disputed" | "superseded" | "deleted";

export interface MemoryFact extends EntityBase<"memory-fact"> {
  areaId: string;
  sourceIds: string[];
  originDeviceId: string;
  knowledgeType: string;
  subject: string;
  predicate: string;
  value: string;
  conflictKey: string;
  displayText: string;
  status: MemoryFactStatus;
  validFrom: string | null;
  validUntil: string | null;
  confirmedAt: string | null;
  confirmedBy: MemoryConfirmationActor | null;
  supersedesId: string | null;
}

export type DecisionStatus = "proposed" | "confirmed" | "superseded" | "revoked" | "deleted";

export interface Decision extends EntityBase<"decision"> {
  areaId: string;
  sourceIds: string[];
  originDeviceId: string;
  title: string;
  decisionText: string;
  rationale: string;
  status: DecisionStatus;
  validFrom: string | null;
  validUntil: string | null;
  confirmedAt: string | null;
  confirmedBy: MemoryConfirmationActor | null;
  supersedesId: string | null;
}

export type MemoryConflictStatus = "open" | "resolved" | "dismissed";
export type MemoryConflictResolution = "keep-fact" | "replace-both" | "not-a-conflict";

export interface MemoryConflict extends EntityBase<"memory-conflict"> {
  areaId: string;
  originDeviceId: string;
  conflictKey: string;
  factIds: string[];
  status: MemoryConflictStatus;
  detectedAt: string;
  resolvedAt: string | null;
  resolvedBy: MemoryConfirmationActor | null;
  resolution: MemoryConflictResolution | null;
  resolvedFactId: string | null;
  note: string | null;
}

export type ProjectStatus = "active" | "on-hold" | "completed" | "archived";

export interface Project extends EntityBase<"project"> {
  areaId: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
}

export type GoalStatus = "planned" | "active" | "achieved" | "abandoned";

export interface Goal extends EntityBase<"goal"> {
  projectId: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  targetAt: string | null;
}

export const TASK_STATUSES = [
  "inbox",
  "planned",
  "in-progress",
  "blocked",
  "completed",
  "discarded",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskImportance = "low" | "medium" | "high";
export type TaskMoneyImpact = "none" | "low" | "medium" | "high";

export interface ManualTaskPriority {
  rank: number;
  decidedAt: string;
  decidedBy: "sir";
  rationale: string | null;
}

export interface ExplicitTaskPriorityDecision {
  actor: "sir";
  explicitlyConfirmed: true;
  decidedAt: string;
  rationale: string | null;
}

export interface ExplicitTaskInputConfirmation {
  actor: "sir";
  explicitlyConfirmed: true;
  confirmedAt: string;
}

export interface Task extends EntityBase<"task"> {
  areaId: string;
  projectId: string | null;
  goalId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueAt: string | null;
  importance: TaskImportance;
  estimatedMinutes: number | null;
  moneyImpact: TaskMoneyImpact;
  expectedIncomeCents: number | null;
  expectedIncomeAt: string | null;
  blockedReason: string | null;
  manualPriority: ManualTaskPriority | null;
}

export interface TaskDependency extends EntityBase<"task-dependency"> {
  taskId: string;
  dependsOnTaskId: string;
}

export type TaskBlockKind = "none" | "explicit" | "dependency" | "explicit-and-dependency";

export interface TaskBlockState {
  blocked: boolean;
  kind: TaskBlockKind;
  blockedReason: string | null;
  blockedByTaskIds: string[];
  explanation: string;
}

export type PersistedEntity =
  | Area
  | Source
  | Note
  | AuditEntry
  | MemoryFact
  | Decision
  | MemoryConflict
  | Project
  | Goal
  | Task
  | TaskDependency;

export interface EntityFactoryOptions {
  id?: string;
  timestamp?: string;
}

export interface CreateAreaInput {
  name: string;
  description?: string | null;
  status?: AreaStatus;
}

export interface CreateSourceInput {
  kind: SourceKind;
  label: string;
  reference?: string | null;
}

export interface CreateNoteInput {
  areaId: string;
  sourceId?: string | null;
  title: string;
  body: string;
  status?: NoteStatus;
}

export interface CreateAuditEntryInput {
  entityType: EntityType;
  entityId: string;
  entityRevision: number;
  action: AuditAction;
  occurredAt?: string;
  summary?: string | null;
}

export interface MemoryEntityFactoryOptions extends EntityFactoryOptions {
  originDeviceId: string;
}

export interface CreateMemoryFactInput {
  areaId: string;
  sourceIds: string[];
  knowledgeType: string;
  subject: string;
  predicate: string;
  value: string;
  conflictKey: string;
  displayText: string;
  validFrom?: string | null;
  validUntil?: string | null;
  supersedesId?: string | null;
}

export interface CreateDecisionInput {
  areaId: string;
  sourceIds: string[];
  title: string;
  decisionText: string;
  rationale: string;
  validFrom?: string | null;
  validUntil?: string | null;
  supersedesId?: string | null;
}

export interface CreateMemoryConflictInput {
  areaId: string;
  conflictKey: string;
  factIds: string[];
  status?: MemoryConflictStatus;
  detectedAt?: string;
  resolvedAt?: string | null;
  resolvedBy?: MemoryConfirmationActor | null;
  resolution?: MemoryConflictResolution | null;
  resolvedFactId?: string | null;
  note?: string | null;
}

export interface CreateProjectInput {
  areaId: string;
  title: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface CreateGoalInput {
  projectId: string;
  title: string;
  description?: string | null;
  status?: GoalStatus;
  targetAt?: string | null;
}

export interface CreateTaskInput {
  areaId: string;
  projectId?: string | null;
  goalId?: string | null;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  dueAt?: string | null;
  importance?: TaskImportance;
  estimatedMinutes?: number | null;
  moneyImpact?: TaskMoneyImpact;
  expectedIncomeCents?: number | null;
  expectedIncomeAt?: string | null;
  blockedReason?: string | null;
}

export interface CreateTaskDependencyInput {
  taskId: string;
  dependsOnTaskId: string;
}

function createEnvelope<TType extends EntityType>(
  type: TType,
  options: EntityFactoryOptions,
): EntityBase<TType> {
  const timestamp = options.timestamp ?? new Date().toISOString();
  const id = options.id ?? globalThis.crypto.randomUUID();

  return {
    id,
    type,
    schemaVersion: RHIA_SCHEMA_VERSION,
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
}

export function createArea(input: CreateAreaInput, options: EntityFactoryOptions = {}): Area {
  return {
    ...createEnvelope("area", options),
    name: input.name,
    description: input.description ?? null,
    status: input.status ?? "active",
  };
}

export function createSource(input: CreateSourceInput, options: EntityFactoryOptions = {}): Source {
  return {
    ...createEnvelope("source", options),
    kind: input.kind,
    label: input.label,
    reference: input.reference ?? null,
  };
}

export function createNote(input: CreateNoteInput, options: EntityFactoryOptions = {}): Note {
  return {
    ...createEnvelope("note", options),
    areaId: input.areaId,
    sourceId: input.sourceId ?? null,
    title: input.title,
    body: input.body,
    status: input.status ?? "active",
  };
}

export function createAuditEntry(
  input: CreateAuditEntryInput,
  options: EntityFactoryOptions = {},
): AuditEntry {
  const envelope = createEnvelope("audit-entry", options);

  return {
    ...envelope,
    entityType: input.entityType,
    entityId: input.entityId,
    entityRevision: input.entityRevision,
    action: input.action,
    occurredAt: input.occurredAt ?? envelope.createdAt,
    summary: input.summary ?? null,
  };
}

export function createMemoryFact(
  input: CreateMemoryFactInput,
  options: MemoryEntityFactoryOptions,
): MemoryFact {
  return {
    ...createEnvelope("memory-fact", options),
    areaId: input.areaId,
    sourceIds: [...input.sourceIds],
    originDeviceId: options.originDeviceId,
    knowledgeType: input.knowledgeType,
    subject: input.subject,
    predicate: input.predicate,
    value: input.value,
    conflictKey: input.conflictKey,
    displayText: input.displayText,
    status: "proposed",
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
    confirmedAt: null,
    confirmedBy: null,
    supersedesId: input.supersedesId ?? null,
  };
}

export function createDecision(
  input: CreateDecisionInput,
  options: MemoryEntityFactoryOptions,
): Decision {
  return {
    ...createEnvelope("decision", options),
    areaId: input.areaId,
    sourceIds: [...input.sourceIds],
    originDeviceId: options.originDeviceId,
    title: input.title,
    decisionText: input.decisionText,
    rationale: input.rationale,
    status: "proposed",
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
    confirmedAt: null,
    confirmedBy: null,
    supersedesId: input.supersedesId ?? null,
  };
}

export function createMemoryConflict(
  input: CreateMemoryConflictInput,
  options: MemoryEntityFactoryOptions,
): MemoryConflict {
  const envelope = createEnvelope("memory-conflict", options);

  return {
    ...envelope,
    areaId: input.areaId,
    originDeviceId: options.originDeviceId,
    conflictKey: input.conflictKey,
    factIds: [...input.factIds],
    status: input.status ?? "open",
    detectedAt: input.detectedAt ?? envelope.createdAt,
    resolvedAt: input.resolvedAt ?? null,
    resolvedBy: input.resolvedBy ?? null,
    resolution: input.resolution ?? null,
    resolvedFactId: input.resolvedFactId ?? null,
    note: input.note ?? null,
  };
}

export const WORK_HUB_RULE_ERROR_CODES = [
  "INVALID_WORK_HUB_AREA",
  "INVALID_TASK_ASSIGNMENT",
  "INVALID_TASK_BLOCK_STATE",
  "INVALID_TASK_INCOME",
  "INVALID_TASK_DEPENDENCY",
  "DUPLICATE_TASK_DEPENDENCY",
  "CYCLIC_TASK_DEPENDENCY",
  "INVALID_TASK_PRIORITY_CONTEXT",
  "MANUAL_TASK_PRIORITY_CONFIRMATION_REQUIRED",
  "TASK_INPUT_CONFIRMATION_REQUIRED",
] as const;

export type WorkHubRuleErrorCode = (typeof WORK_HUB_RULE_ERROR_CODES)[number];

export class WorkHubRuleError extends Error {
  readonly code: WorkHubRuleErrorCode;

  constructor(code: WorkHubRuleErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "WorkHubRuleError";
    this.code = code;
  }
}

export function isWorkHubAreaName(name: string): name is WorkHubAreaName {
  return WORK_HUB_AREA_NAMES.some((requiredName) => requiredName === name);
}

export function getMissingWorkHubAreaNames(
  areas: readonly Pick<Area, "name" | "status" | "deletedAt">[],
): WorkHubAreaName[] {
  const availableNames = new Set(
    areas
      .filter((area) => area.status === "active" && area.deletedAt === null)
      .map((area) => area.name)
      .filter(isWorkHubAreaName),
  );

  return WORK_HUB_AREA_NAMES.filter((name) => !availableNames.has(name));
}

export function assertWorkHubAreaAssignment(
  areaId: string,
  area: Area | null,
): asserts area is ActiveWorkHubArea {
  if (
    area === null ||
    area.id !== areaId ||
    area.status !== "active" ||
    area.deletedAt !== null ||
    !isWorkHubAreaName(area.name)
  ) {
    throw new WorkHubRuleError(
      "INVALID_WORK_HUB_AREA",
      "Projekte und Aufgaben müssen einem aktiven RHIA-Pflichtbereich zugeordnet sein.",
    );
  }
}

export function createProject(
  input: CreateProjectInput,
  options: EntityFactoryOptions = {},
): Project {
  return {
    ...createEnvelope("project", options),
    areaId: input.areaId,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? "active",
  };
}

export function createGoal(input: CreateGoalInput, options: EntityFactoryOptions = {}): Goal {
  return {
    ...createEnvelope("goal", options),
    projectId: input.projectId,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? "planned",
    targetAt: input.targetAt ?? null,
  };
}

export function createTask(input: CreateTaskInput, options: EntityFactoryOptions = {}): Task {
  const projectId = input.projectId ?? null;
  const goalId = input.goalId ?? null;
  const status = input.status ?? "inbox";
  const blockedReason = input.blockedReason ?? null;
  const moneyImpact = input.moneyImpact ?? "none";
  const expectedIncomeCents = input.expectedIncomeCents ?? null;
  const expectedIncomeAt = input.expectedIncomeAt ?? null;

  assertTaskAssignmentIds(projectId, goalId);
  assertTaskBlockState(status, blockedReason);
  assertTaskIncome(moneyImpact, expectedIncomeCents, expectedIncomeAt);

  return {
    ...createEnvelope("task", options),
    areaId: input.areaId,
    projectId,
    goalId,
    title: input.title,
    description: input.description ?? null,
    status,
    dueAt: input.dueAt ?? null,
    importance: input.importance ?? "medium",
    estimatedMinutes: input.estimatedMinutes ?? null,
    moneyImpact,
    expectedIncomeCents,
    expectedIncomeAt,
    blockedReason,
    manualPriority: null,
  };
}

export function createConfirmedTask(
  input: CreateTaskInput,
  confirmation: ExplicitTaskInputConfirmation,
  options: EntityFactoryOptions = {},
): Task {
  const task = createTask(input, {
    ...options,
    timestamp: options.timestamp ?? confirmation.confirmedAt,
  });
  if (
    confirmation.actor !== "sir" ||
    confirmation.explicitlyConfirmed !== true ||
    Number.isNaN(Date.parse(confirmation.confirmedAt)) ||
    Date.parse(confirmation.confirmedAt) < Date.parse(task.createdAt)
  ) {
    throw new WorkHubRuleError(
      "TASK_INPUT_CONFIRMATION_REQUIRED",
      "Eine reale Aufgabe wird nur nach ausdrücklicher Bestätigung durch Sir übernommen.",
    );
  }
  return task;
}

export function createTaskDependency(
  input: CreateTaskDependencyInput,
  options: EntityFactoryOptions = {},
): TaskDependency {
  if (input.taskId === input.dependsOnTaskId) {
    throw new WorkHubRuleError(
      "INVALID_TASK_DEPENDENCY",
      "Eine Aufgabe darf nicht von sich selbst abhängen.",
    );
  }

  return {
    ...createEnvelope("task-dependency", options),
    taskId: input.taskId,
    dependsOnTaskId: input.dependsOnTaskId,
  };
}

export function assertTaskAssignmentIds(projectId: string | null, goalId: string | null): void {
  if (goalId !== null && projectId === null) {
    throw new WorkHubRuleError(
      "INVALID_TASK_ASSIGNMENT",
      "Eine Aufgabe mit Ziel benötigt auch das zugehörige Projekt.",
    );
  }
}

export function assertTaskBlockState(status: TaskStatus, blockedReason: string | null): void {
  if ((status === "blocked") !== (blockedReason !== null)) {
    throw new WorkHubRuleError(
      "INVALID_TASK_BLOCK_STATE",
      "Status Blockiert und Blockadegrund müssen gemeinsam gesetzt oder entfernt werden.",
    );
  }
}

export function assertTaskIncome(
  moneyImpact: TaskMoneyImpact,
  expectedIncomeCents: number | null,
  expectedIncomeAt: string | null,
): void {
  if (moneyImpact === "none" && (expectedIncomeCents !== null || expectedIncomeAt !== null)) {
    throw new WorkHubRuleError(
      "INVALID_TASK_INCOME",
      "Eine Aufgabe ohne Geldwirkung darf keine erwarteten Einnahmen enthalten.",
    );
  }

  if (expectedIncomeAt !== null && expectedIncomeCents === null) {
    throw new WorkHubRuleError(
      "INVALID_TASK_INCOME",
      "Ein erwarteter Einnahmezeitpunkt benötigt einen Einnahmewert.",
    );
  }
}

export function assertGoalProjectAssignment(goal: Goal, project: Project): void {
  if (goal.projectId !== project.id) {
    throw new WorkHubRuleError(
      "INVALID_TASK_ASSIGNMENT",
      "Das Ziel gehört nicht zum angegebenen Projekt.",
    );
  }
}

export function assertTaskAssignment(task: Task, project: Project | null, goal: Goal | null): void {
  assertTaskAssignmentIds(task.projectId, task.goalId);

  if (
    (task.projectId === null) !== (project === null) ||
    (project !== null && project.id !== task.projectId)
  ) {
    throw new WorkHubRuleError(
      "INVALID_TASK_ASSIGNMENT",
      "Die Projektzuordnung der Aufgabe ist unvollständig oder widersprüchlich.",
    );
  }

  if (project !== null && project.areaId !== task.areaId) {
    throw new WorkHubRuleError(
      "INVALID_TASK_ASSIGNMENT",
      "Aufgabe und Projekt müssen zum gleichen Bereich gehören.",
    );
  }

  if ((task.goalId === null) !== (goal === null) || (goal !== null && goal.id !== task.goalId)) {
    throw new WorkHubRuleError(
      "INVALID_TASK_ASSIGNMENT",
      "Die Zielzuordnung der Aufgabe ist unvollständig oder widersprüchlich.",
    );
  }

  if (goal !== null && goal.projectId !== task.projectId) {
    throw new WorkHubRuleError(
      "INVALID_TASK_ASSIGNMENT",
      "Das Ziel der Aufgabe muss zum zugeordneten Projekt gehören.",
    );
  }
}

export function assertTaskDependencyGraph(
  tasks: readonly Task[],
  dependencies: readonly TaskDependency[],
): void {
  const taskIds = new Set(tasks.map((task) => task.id));
  const seenPairs = new Set<string>();
  const outgoing = new Map<string, string[]>();

  for (const dependency of dependencies) {
    if (
      dependency.taskId === dependency.dependsOnTaskId ||
      !taskIds.has(dependency.taskId) ||
      !taskIds.has(dependency.dependsOnTaskId)
    ) {
      throw new WorkHubRuleError(
        "INVALID_TASK_DEPENDENCY",
        "Eine Aufgabenabhängigkeit muss zwei vorhandene unterschiedliche Aufgaben verbinden.",
      );
    }

    const pair = `${dependency.taskId}:${dependency.dependsOnTaskId}`;
    if (seenPairs.has(pair)) {
      throw new WorkHubRuleError(
        "DUPLICATE_TASK_DEPENDENCY",
        "Dieselbe Aufgabenabhängigkeit darf nur einmal vorkommen.",
      );
    }
    seenPairs.add(pair);

    const targets = outgoing.get(dependency.taskId) ?? [];
    targets.push(dependency.dependsOnTaskId);
    outgoing.set(dependency.taskId, targets);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (taskId: string): void => {
    if (visiting.has(taskId)) {
      throw new WorkHubRuleError(
        "CYCLIC_TASK_DEPENDENCY",
        "Aufgabenabhängigkeiten dürfen keinen Kreis bilden.",
      );
    }
    if (visited.has(taskId)) {
      return;
    }

    visiting.add(taskId);
    for (const dependencyId of outgoing.get(taskId) ?? []) {
      visit(dependencyId);
    }
    visiting.delete(taskId);
    visited.add(taskId);
  };

  for (const task of tasks) {
    visit(task.id);
  }
}

export function getTaskBlockState(
  task: Task,
  tasks: readonly Task[],
  dependencies: readonly TaskDependency[],
): TaskBlockState {
  assertTaskDependencyGraph(tasks, dependencies);

  if (task.status === "completed" || task.status === "discarded") {
    return {
      blocked: false,
      kind: "none",
      blockedReason: null,
      blockedByTaskIds: [],
      explanation: "Die Aufgabe ist abgeschlossen und hat keine aktive Blockade.",
    };
  }

  const taskById = new Map(tasks.map((candidate) => [candidate.id, candidate]));
  const blockedByTaskIds = dependencies
    .filter((dependency) => dependency.taskId === task.id)
    .map((dependency) => dependency.dependsOnTaskId)
    .filter((dependencyId) => taskById.get(dependencyId)?.status !== "completed")
    .toSorted();
  const explicitReason = task.status === "blocked" ? task.blockedReason : null;
  const hasExplicitBlock = explicitReason !== null;
  const hasDependencyBlock = blockedByTaskIds.length > 0;

  if (hasExplicitBlock && hasDependencyBlock) {
    return {
      blocked: true,
      kind: "explicit-and-dependency",
      blockedReason: explicitReason,
      blockedByTaskIds,
      explanation: `${explicitReason} Zusätzlich sind ${blockedByTaskIds.length} abhängige Aufgaben offen.`,
    };
  }

  if (hasExplicitBlock) {
    return {
      blocked: true,
      kind: "explicit",
      blockedReason: explicitReason,
      blockedByTaskIds: [],
      explanation: explicitReason,
    };
  }

  if (hasDependencyBlock) {
    return {
      blocked: true,
      kind: "dependency",
      blockedReason: null,
      blockedByTaskIds,
      explanation: `${blockedByTaskIds.length} abhängige Aufgaben sind noch nicht erledigt.`,
    };
  }

  return {
    blocked: false,
    kind: "none",
    blockedReason: null,
    blockedByTaskIds: [],
    explanation: "Keine aktive Blockade.",
  };
}

export const TASK_PRIORITY_FACTOR_KEYS = [
  "deadline",
  "importance",
  "blockage",
  "money-impact",
  "income-timing",
  "effort-fit",
  "protected-work",
] as const;
export type TaskPriorityFactorKey = (typeof TASK_PRIORITY_FACTOR_KEYS)[number];

export interface TaskPriorityFactor {
  key: TaskPriorityFactorKey;
  points: number;
  explanation: string;
}

export interface TaskPriorityContext {
  now: string;
  availableMinutes?: number | null;
  protectedAreaIds?: readonly string[];
}

export interface TaskPriorityEvaluation {
  taskId: string;
  score: number;
  blocked: boolean;
  blockedByTaskIds: string[];
  factors: TaskPriorityFactor[];
  explanation: string;
}

export interface RankedTaskPriority extends TaskPriorityEvaluation {
  rank: number;
  source: "manual" | "automatic";
}

const DAY_IN_MILLISECONDS = 86_400_000;

function deadlineFactor(dueAt: string | null, now: number): TaskPriorityFactor {
  if (dueAt === null) {
    return { key: "deadline", points: 0, explanation: "Keine feste Frist." };
  }

  const daysUntilDue = (Date.parse(dueAt) - now) / DAY_IN_MILLISECONDS;
  if (daysUntilDue <= 0) {
    return {
      key: "deadline",
      points: 1_000,
      explanation: "Frist ist erreicht oder überschritten.",
    };
  }
  if (daysUntilDue <= 1) {
    return { key: "deadline", points: 900, explanation: "Frist liegt innerhalb von 24 Stunden." };
  }
  if (daysUntilDue <= 3) {
    return { key: "deadline", points: 750, explanation: "Frist liegt innerhalb von drei Tagen." };
  }
  if (daysUntilDue <= 7) {
    return { key: "deadline", points: 600, explanation: "Frist liegt innerhalb einer Woche." };
  }
  return { key: "deadline", points: 300, explanation: "Feste spätere Frist vorhanden." };
}

function importanceFactor(importance: TaskImportance): TaskPriorityFactor {
  const values: Record<TaskImportance, [number, string]> = {
    high: [250, "Hohe Wichtigkeit."],
    medium: [150, "Mittlere Wichtigkeit."],
    low: [50, "Niedrige Wichtigkeit."],
  };
  const [points, explanation] = values[importance];
  return { key: "importance", points, explanation };
}

function moneyImpactFactor(moneyImpact: TaskMoneyImpact): TaskPriorityFactor {
  const values: Record<TaskMoneyImpact, [number, string]> = {
    high: [140, "Hohe Geld- oder Geschäftswirkung."],
    medium: [90, "Mittlere Geld- oder Geschäftswirkung."],
    low: [40, "Geringe Geld- oder Geschäftswirkung."],
    none: [0, "Keine direkte Geldwirkung."],
  };
  const [points, explanation] = values[moneyImpact];
  return { key: "money-impact", points, explanation };
}

function incomeTimingFactor(expectedIncomeAt: string | null, now: number): TaskPriorityFactor {
  if (expectedIncomeAt === null) {
    return { key: "income-timing", points: 0, explanation: "Kein Geldeingang terminiert." };
  }

  const daysUntilIncome = (Date.parse(expectedIncomeAt) - now) / DAY_IN_MILLISECONDS;
  if (daysUntilIncome <= 7) {
    return { key: "income-timing", points: 120, explanation: "Geldeingang innerhalb einer Woche." };
  }
  if (daysUntilIncome <= 30) {
    return { key: "income-timing", points: 80, explanation: "Geldeingang innerhalb eines Monats." };
  }
  return { key: "income-timing", points: 35, explanation: "Späterer Geldeingang erwartet." };
}

function effortFitFactor(
  estimatedMinutes: number | null,
  availableMinutes: number | null,
): TaskPriorityFactor {
  if (estimatedMinutes === null) {
    return { key: "effort-fit", points: 0, explanation: "Aufwand ist noch nicht geschätzt." };
  }
  if (availableMinutes !== null && estimatedMinutes <= availableMinutes) {
    return {
      key: "effort-fit",
      points: 90,
      explanation: "Die Aufgabe passt vollständig in die verfügbare Zeit.",
    };
  }
  if (estimatedMinutes <= 30) {
    return {
      key: "effort-fit",
      points: 70,
      explanation: "Kurzer Aufwand von höchstens 30 Minuten.",
    };
  }
  if (estimatedMinutes <= 120) {
    return {
      key: "effort-fit",
      points: 40,
      explanation: "Überschaubarer Aufwand von höchstens zwei Stunden.",
    };
  }
  return { key: "effort-fit", points: 10, explanation: "Hoher Zeitaufwand." };
}

export function evaluateTaskPriority(
  task: Task,
  tasks: readonly Task[],
  dependencies: readonly TaskDependency[],
  context: TaskPriorityContext,
): TaskPriorityEvaluation {
  const now = Date.parse(context.now);
  const availableMinutes = context.availableMinutes ?? null;
  if (
    Number.isNaN(now) ||
    (availableMinutes !== null && (!Number.isInteger(availableMinutes) || availableMinutes <= 0))
  ) {
    throw new WorkHubRuleError(
      "INVALID_TASK_PRIORITY_CONTEXT",
      "Die Prioritätsberechnung benötigt einen gültigen Zeitpunkt und eine positive verfügbare Zeit.",
    );
  }

  const blockState = getTaskBlockState(task, tasks, dependencies);
  const factors: TaskPriorityFactor[] = [
    deadlineFactor(task.dueAt, now),
    importanceFactor(task.importance),
    {
      key: "blockage",
      points: blockState.blocked ? -500 : 0,
      explanation: blockState.explanation,
    },
    moneyImpactFactor(task.moneyImpact),
    incomeTimingFactor(task.expectedIncomeAt, now),
    effortFitFactor(task.estimatedMinutes, availableMinutes),
    context.protectedAreaIds?.includes(task.areaId)
      ? {
          key: "protected-work",
          points: 35,
          explanation: "Geschütztes Langzeitprojekt RHIA oder Shadow Grown.",
        }
      : { key: "protected-work", points: 0, explanation: "Kein Schutzbereich zugeordnet." },
  ];
  const inactive = task.status === "completed" || task.status === "discarded";
  const score = inactive ? -10_000 : factors.reduce((sum, factor) => sum + factor.points, 0);
  const strongestReasons = factors
    .filter((factor) => factor.points !== 0)
    .toSorted((left, right) => Math.abs(right.points) - Math.abs(left.points))
    .slice(0, 3)
    .map((factor) => factor.explanation);

  return {
    taskId: task.id,
    score,
    blocked: blockState.blocked,
    blockedByTaskIds: blockState.blockedByTaskIds,
    factors,
    explanation: inactive
      ? "Erledigte oder verworfene Aufgaben werden nicht aktiv priorisiert."
      : strongestReasons.join(" "),
  };
}

export function rankTasksByAutomaticPriority(
  tasks: readonly Task[],
  dependencies: readonly TaskDependency[],
  context: TaskPriorityContext,
): TaskPriorityEvaluation[] {
  return tasks
    .map((task) => evaluateTaskPriority(task, tasks, dependencies, context))
    .toSorted((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }
      return left.taskId.localeCompare(right.taskId);
    });
}

function assertExplicitTaskPriorityDecision(decision: ExplicitTaskPriorityDecision): void {
  if (
    decision.actor !== "sir" ||
    decision.explicitlyConfirmed !== true ||
    Number.isNaN(Date.parse(decision.decidedAt))
  ) {
    throw new WorkHubRuleError(
      "MANUAL_TASK_PRIORITY_CONFIRMATION_REQUIRED",
      "Eine manuelle Priorität benötigt eine ausdrückliche Entscheidung von Sir.",
    );
  }
}

export function setManualTaskPriority(
  task: Task,
  rank: number,
  decision: ExplicitTaskPriorityDecision,
): Task {
  assertExplicitTaskPriorityDecision(decision);
  if (
    !Number.isInteger(rank) ||
    rank <= 0 ||
    Date.parse(decision.decidedAt) < Date.parse(task.createdAt) ||
    task.deletedAt !== null ||
    task.status === "completed" ||
    task.status === "discarded"
  ) {
    throw new WorkHubRuleError(
      "MANUAL_TASK_PRIORITY_CONFIRMATION_REQUIRED",
      "Die manuelle Priorität ist für diese Aufgabe oder diesen Rang nicht zulässig.",
    );
  }

  return {
    ...task,
    manualPriority: {
      rank,
      decidedAt: decision.decidedAt,
      decidedBy: decision.actor,
      rationale: decision.rationale ?? null,
    },
  };
}

export function clearManualTaskPriority(task: Task, decision: ExplicitTaskPriorityDecision): Task {
  assertExplicitTaskPriorityDecision(decision);
  return { ...task, manualPriority: null };
}

export function rankTasksByPriority(
  tasks: readonly Task[],
  dependencies: readonly TaskDependency[],
  context: TaskPriorityContext,
): RankedTaskPriority[] {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const automatic = rankTasksByAutomaticPriority(tasks, dependencies, context);
  const active = automatic.filter((evaluation) => {
    const task = taskById.get(evaluation.taskId);
    return task?.status !== "completed" && task?.status !== "discarded" && task?.deletedAt === null;
  });
  const activeIds = new Set(active.map((evaluation) => evaluation.taskId));
  const inactive = automatic.filter((evaluation) => !activeIds.has(evaluation.taskId));
  const manuallyRanked = active
    .filter((evaluation) => taskById.get(evaluation.taskId)?.manualPriority !== null)
    .toSorted((left, right) => {
      const leftPriority = taskById.get(left.taskId)?.manualPriority;
      const rightPriority = taskById.get(right.taskId)?.manualPriority;
      if (!leftPriority || !rightPriority) {
        return left.taskId.localeCompare(right.taskId);
      }
      if (leftPriority.rank !== rightPriority.rank) {
        return leftPriority.rank - rightPriority.rank;
      }
      if (leftPriority.decidedAt !== rightPriority.decidedAt) {
        return rightPriority.decidedAt.localeCompare(leftPriority.decidedAt);
      }
      return left.taskId.localeCompare(right.taskId);
    });
  const automaticOnly = active.filter(
    (evaluation) => taskById.get(evaluation.taskId)?.manualPriority === null,
  );
  const slots = new Array<TaskPriorityEvaluation | undefined>(active.length);

  for (const evaluation of manuallyRanked) {
    const requestedRank = taskById.get(evaluation.taskId)?.manualPriority?.rank ?? 1;
    let index = Math.min(requestedRank - 1, slots.length - 1);
    while (index < slots.length && slots[index] !== undefined) {
      index += 1;
    }
    if (index >= slots.length) {
      index = slots.indexOf(undefined);
    }
    slots[index] = evaluation;
  }

  let automaticIndex = 0;
  for (let index = 0; index < slots.length; index += 1) {
    if (slots[index] === undefined) {
      slots[index] = automaticOnly[automaticIndex];
      automaticIndex += 1;
    }
  }

  const rankedActive = slots.flatMap((evaluation, index): RankedTaskPriority[] => {
    if (!evaluation) {
      return [];
    }
    const manualPriority = taskById.get(evaluation.taskId)?.manualPriority;
    return [
      {
        ...evaluation,
        rank: index + 1,
        source: manualPriority ? "manual" : "automatic",
        explanation: manualPriority
          ? `Manuelle Priorität von Sir: Rang ${manualPriority.rank}. ${manualPriority.rationale ?? ""}`.trim()
          : evaluation.explanation,
      },
    ];
  });
  const rankedInactive = inactive.map(
    (evaluation, index): RankedTaskPriority => ({
      ...evaluation,
      rank: rankedActive.length + index + 1,
      source: "automatic",
    }),
  );

  return [...rankedActive, ...rankedInactive];
}

export interface RepositoryReadOptions {
  includeDeleted?: boolean;
}

export interface EntityRepository<TEntity extends PersistedEntity> {
  getById(id: string, options?: RepositoryReadOptions): Promise<TEntity | undefined>;
  list(options?: RepositoryReadOptions): Promise<TEntity[]>;
  create(entity: TEntity): Promise<TEntity>;
  replace(entity: TEntity, expectedRevision: number): Promise<TEntity>;
  softDelete(id: string, expectedRevision: number): Promise<TEntity>;
  restore(id: string, expectedRevision: number): Promise<TEntity>;
  hardDelete(id: string, expectedRevision: number): Promise<void>;
}

export const REPOSITORY_ERROR_CODES = [
  "RECORD_NOT_FOUND",
  "RECORD_ALREADY_EXISTS",
  "REVISION_CONFLICT",
  "VALIDATION_FAILED",
  "PERSISTENCE_UNAVAILABLE",
  "BACKUP_INVALID",
  "BACKUP_CHECKSUM_MISMATCH",
  "IMPORT_CONFLICT",
  "CONFIRMATION_REQUIRED",
  "INVALID_STATE_TRANSITION",
] as const;

export type RepositoryErrorCode = (typeof REPOSITORY_ERROR_CODES)[number];

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RepositoryError";
    this.code = code;
  }
}

export type MemoryProposal = MemoryFact | Decision;
export type ConfirmedMemoryRecord = MemoryFact | Decision;

export interface ExplicitMemoryConfirmation {
  actor: MemoryConfirmationActor;
  explicitlyConfirmed: true;
  confirmedAt: string;
}

export function assertPendingMemoryProposal(proposal: MemoryProposal): void {
  if (proposal.status !== "proposed" || proposal.deletedAt !== null) {
    throw new RepositoryError(
      "INVALID_STATE_TRANSITION",
      "Nur ein offener Gedächtnisvorschlag kann bestätigt oder abgelehnt werden.",
    );
  }
}

export function assertActiveConfirmedMemoryRecord(record: ConfirmedMemoryRecord): void {
  if (record.status !== "confirmed" || record.deletedAt !== null) {
    throw new RepositoryError(
      "INVALID_STATE_TRANSITION",
      "Nur eine aktive bestätigte Gedächtnisfassung kann korrigiert, ersetzt oder verworfen werden.",
    );
  }
}

function assertExplicitMemoryConfirmation(confirmation: ExplicitMemoryConfirmation): void {
  if (confirmation.actor !== "sir" || confirmation.explicitlyConfirmed !== true) {
    throw new RepositoryError(
      "CONFIRMATION_REQUIRED",
      "Gedächtniswissen wird erst nach ausdrücklicher Bestätigung durch Sir aktiviert.",
    );
  }
}

export function confirmMemoryFactProposal(
  fact: MemoryFact,
  confirmation: ExplicitMemoryConfirmation,
): MemoryFact {
  assertPendingMemoryProposal(fact);
  assertExplicitMemoryConfirmation(confirmation);

  return {
    ...fact,
    status: "confirmed",
    confirmedAt: confirmation.confirmedAt,
    confirmedBy: confirmation.actor,
  };
}

export function confirmDecisionProposal(
  decision: Decision,
  confirmation: ExplicitMemoryConfirmation,
): Decision {
  assertPendingMemoryProposal(decision);
  assertExplicitMemoryConfirmation(confirmation);

  return {
    ...decision,
    status: "confirmed",
    confirmedAt: confirmation.confirmedAt,
    confirmedBy: confirmation.actor,
  };
}

export function supersedeMemoryFact(fact: MemoryFact): MemoryFact {
  if (fact.status === "superseded" && fact.deletedAt === null) {
    return fact;
  }
  assertActiveConfirmedMemoryRecord(fact);

  return {
    ...fact,
    status: "superseded",
  };
}

export function supersedeDecision(decision: Decision): Decision {
  assertActiveConfirmedMemoryRecord(decision);

  return {
    ...decision,
    status: "superseded",
  };
}

export function revokeDecision(decision: Decision): Decision {
  assertActiveConfirmedMemoryRecord(decision);

  return {
    ...decision,
    status: "revoked",
  };
}
