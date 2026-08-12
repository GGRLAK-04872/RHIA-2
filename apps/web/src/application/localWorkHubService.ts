import {
  type AuditEntry,
  assertGoalProjectAssignment,
  assertTaskAssignment,
  assertTaskAssignmentIds,
  assertTaskBlockState,
  assertTaskDependencyGraph,
  assertTaskIncome,
  assertWorkHubAreaAssignment,
  type CreateTaskInput,
  clearManualTaskPriority,
  createArea,
  createAuditEntry,
  createConfirmedTask,
  createGoal,
  createProject,
  createTaskDependency,
  type ExplicitTaskInputConfirmation,
  type ExplicitTaskPriorityDecision,
  type Goal,
  getMissingWorkHubAreaNames,
  type Project,
  RepositoryError,
  setManualTaskPriority,
  type Task,
  type TaskDependency,
} from "@rhia/domain";
import { createRhiaBrowserStorage, type RhiaBrowserStorage } from "@rhia/storage-browser";
import type { WorkHubWorkspace } from "./workHubView";

export interface WorkHubTrash {
  projects: Project[];
  goals: Goal[];
  tasks: Task[];
  dependencies: TaskDependency[];
}

export interface LocalWorkHubSnapshot {
  workspace: WorkHubWorkspace;
  trash: WorkHubTrash;
  auditEntries: AuditEntry[];
}

export interface NewWorkHubProject {
  areaId: string;
  title: string;
  description?: string | null;
}

export interface NewWorkHubGoal {
  projectId: string;
  title: string;
  description?: string | null;
  targetAt?: string | null;
}

export type EditableTaskFields = Pick<
  Task,
  | "areaId"
  | "projectId"
  | "goalId"
  | "title"
  | "description"
  | "status"
  | "dueAt"
  | "importance"
  | "estimatedMinutes"
  | "moneyImpact"
  | "expectedIncomeCents"
  | "expectedIncomeAt"
  | "blockedReason"
>;

export class LocalWorkHubService {
  private readonly storage: RhiaBrowserStorage;
  private opened = false;
  private initialization: Promise<void> | null = null;

  constructor(storage: RhiaBrowserStorage = createRhiaBrowserStorage()) {
    this.storage = storage;
  }

  async initialize(): Promise<LocalWorkHubSnapshot> {
    if (!this.initialization) {
      this.initialization = this.prepare();
    }
    await this.initialization;
    return this.getSnapshot();
  }

  private async prepare(): Promise<void> {
    if (!this.opened) {
      await this.storage.open();
      this.opened = true;
    }
    await this.storage.purgeExpiredTrash();
    await this.ensureRequiredAreas();
  }

  async getSnapshot(): Promise<LocalWorkHubSnapshot> {
    const [areas, projects, goals, tasks, dependencies, auditEntries] = await Promise.all([
      this.storage.areas.list({ includeDeleted: true }),
      this.storage.projects.list({ includeDeleted: true }),
      this.storage.goals.list({ includeDeleted: true }),
      this.storage.tasks.list({ includeDeleted: true }),
      this.storage.taskDependencies.list({ includeDeleted: true }),
      this.storage.auditEntries.list({ includeDeleted: true }),
    ]);

    return {
      workspace: {
        areas: areas.filter((area) => area.deletedAt === null),
        projects: projects.filter((project) => project.deletedAt === null),
        goals: goals.filter((goal) => goal.deletedAt === null),
        tasks: tasks.filter((task) => task.deletedAt === null),
        dependencies: dependencies.filter((dependency) => dependency.deletedAt === null),
      },
      trash: {
        projects: projects.filter((project) => project.deletedAt !== null),
        goals: goals.filter((goal) => goal.deletedAt !== null),
        tasks: tasks.filter((task) => task.deletedAt !== null),
        dependencies: dependencies.filter((dependency) => dependency.deletedAt !== null),
      },
      auditEntries,
    };
  }

  async createProject(input: NewWorkHubProject): Promise<LocalWorkHubSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const area = (await repositories.areas.getById(input.areaId)) ?? null;
      assertWorkHubAreaAssignment(input.areaId, area);
      const project = createProject(input);
      await repositories.projects.create(project);
      await repositories.auditEntries.create(this.audit(project, "create"));
    });
    return this.getSnapshot();
  }

  async createGoal(input: NewWorkHubGoal): Promise<LocalWorkHubSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const project = await repositories.projects.getById(input.projectId);
      if (!project) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Das Projekt wurde nicht gefunden.");
      }
      const goal = createGoal(input);
      assertGoalProjectAssignment(goal, project);
      await repositories.goals.create(goal);
      await repositories.auditEntries.create(this.audit(goal, "create"));
    });
    return this.getSnapshot();
  }

  async createConfirmedTask(
    input: CreateTaskInput,
    confirmation: ExplicitTaskInputConfirmation,
  ): Promise<LocalWorkHubSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const area = (await repositories.areas.getById(input.areaId)) ?? null;
      assertWorkHubAreaAssignment(input.areaId, area);
      const project = input.projectId
        ? ((await repositories.projects.getById(input.projectId)) ?? null)
        : null;
      const goal = input.goalId ? ((await repositories.goals.getById(input.goalId)) ?? null) : null;
      const task = createConfirmedTask(input, confirmation);
      assertTaskAssignment(task, project, goal);
      await repositories.tasks.create(task);
      await repositories.auditEntries.create(
        createAuditEntry({
          entityType: task.type,
          entityId: task.id,
          entityRevision: task.revision,
          action: "create",
          summary: "Von Sir ausdrücklich bestätigte Aufgabeneingabe.",
        }),
      );
    });
    return this.getSnapshot();
  }

  async updateTask(
    taskId: string,
    expectedRevision: number,
    input: EditableTaskFields,
  ): Promise<LocalWorkHubSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const current = await repositories.tasks.getById(taskId);
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Die Aufgabe wurde nicht gefunden.");
      }
      assertTaskAssignmentIds(input.projectId, input.goalId);
      assertTaskBlockState(input.status, input.blockedReason);
      assertTaskIncome(input.moneyImpact, input.expectedIncomeCents, input.expectedIncomeAt);
      const project = input.projectId
        ? ((await repositories.projects.getById(input.projectId)) ?? null)
        : null;
      const goal = input.goalId ? ((await repositories.goals.getById(input.goalId)) ?? null) : null;
      const area = (await repositories.areas.getById(input.areaId)) ?? null;
      assertWorkHubAreaAssignment(input.areaId, area);
      const candidate = { ...current, ...input };
      assertTaskAssignment(candidate, project, goal);
      const updated = await repositories.tasks.replace(candidate, expectedRevision);
      await repositories.auditEntries.create(this.audit(updated, "update"));
    });
    return this.getSnapshot();
  }

  async setTaskManualPriority(
    taskId: string,
    expectedRevision: number,
    rank: number,
    decision: ExplicitTaskPriorityDecision,
  ): Promise<LocalWorkHubSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const task = await repositories.tasks.getById(taskId);
      if (!task) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Die Aufgabe wurde nicht gefunden.");
      }
      const updated = await repositories.tasks.replace(
        setManualTaskPriority(task, rank, decision),
        expectedRevision,
      );
      await repositories.auditEntries.create(this.audit(updated, "update"));
    });
    return this.getSnapshot();
  }

  async clearTaskManualPriority(
    taskId: string,
    expectedRevision: number,
    decision: ExplicitTaskPriorityDecision,
  ): Promise<LocalWorkHubSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const task = await repositories.tasks.getById(taskId);
      if (!task) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Die Aufgabe wurde nicht gefunden.");
      }
      const updated = await repositories.tasks.replace(
        clearManualTaskPriority(task, decision),
        expectedRevision,
      );
      await repositories.auditEntries.create(this.audit(updated, "update"));
    });
    return this.getSnapshot();
  }

  async addDependency(taskId: string, dependsOnTaskId: string): Promise<LocalWorkHubSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const tasks = await repositories.tasks.list();
      const dependencies = await repositories.taskDependencies.list();
      const dependency = createTaskDependency({ taskId, dependsOnTaskId });
      assertTaskDependencyGraph(tasks, [...dependencies, dependency]);
      await repositories.taskDependencies.create(dependency);
      await repositories.auditEntries.create(this.audit(dependency, "create"));
    });
    return this.getSnapshot();
  }

  async moveTaskToTrash(taskId: string, expectedRevision: number): Promise<LocalWorkHubSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const deleted = await repositories.tasks.softDelete(taskId, expectedRevision);
      await repositories.auditEntries.create(this.audit(deleted, "delete"));
    });
    return this.getSnapshot();
  }

  async restoreTask(taskId: string, expectedRevision: number): Promise<LocalWorkHubSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const restored = await repositories.tasks.restore(taskId, expectedRevision);
      await repositories.auditEntries.create(this.audit(restored, "restore"));
    });
    return this.getSnapshot();
  }

  private async ensureRequiredAreas(): Promise<void> {
    await this.storage.transaction(async (repositories) => {
      const areas = await repositories.areas.list();
      for (const name of getMissingWorkHubAreaNames(areas)) {
        const area = createArea({
          name,
          description: "Verbindlicher Bereich der lokalen RHIA-Arbeitszentrale.",
        });
        await repositories.areas.create(area);
        await repositories.auditEntries.create(this.audit(area, "create"));
      }
    });
  }

  private audit(
    entity: Project | Goal | Task | TaskDependency | ReturnType<typeof createArea>,
    action: "create" | "update" | "delete" | "restore",
  ): AuditEntry {
    return createAuditEntry({
      entityType: entity.type,
      entityId: entity.id,
      entityRevision: entity.revision,
      action,
      summary: "Lokale Arbeitszentrale.",
    });
  }
}

export const localWorkHubService = new LocalWorkHubService();
