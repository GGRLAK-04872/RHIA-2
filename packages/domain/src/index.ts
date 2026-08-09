export const RHIA_PRODUCT_NAME = "RHIA 2.0" as const;
export const RHIA_VERSION = "0.2.0" as const;
export const RHIA_STAGE = 2 as const;
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
  "INVALID_TASK_ASSIGNMENT",
  "INVALID_TASK_BLOCK_STATE",
  "INVALID_TASK_INCOME",
  "INVALID_TASK_DEPENDENCY",
  "DUPLICATE_TASK_DEPENDENCY",
  "CYCLIC_TASK_DEPENDENCY",
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

  if ((task.projectId === null) !== (project === null) || project?.id !== task.projectId) {
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

  if ((task.goalId === null) !== (goal === null) || goal?.id !== task.goalId) {
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
