import {
  type Area,
  type Goal,
  type Project,
  type RankedTaskPriority,
  rankTasksByPriority,
  type Task,
  type TaskDependency,
  type TaskStatus,
} from "@rhia/domain";

export interface WorkHubWorkspace {
  areas: Area[];
  projects: Project[];
  goals: Goal[];
  tasks: Task[];
  dependencies: TaskDependency[];
}

export interface WorkHubViewFilters {
  query: string;
  areaId: string | null;
  projectId: string | null;
  status: TaskStatus | null;
}

export interface WorkHubTaskView {
  task: Task;
  areaName: string;
  projectTitle: string | null;
  goalTitle: string | null;
  priority: RankedTaskPriority;
}

export interface WorkHubProjectView {
  project: Project;
  areaName: string;
  tasks: WorkHubTaskView[];
}

export interface WorkHubViews {
  all: WorkHubTaskView[];
  inbox: WorkHubTaskView[];
  focus: WorkHubTaskView[];
  projects: WorkHubProjectView[];
}

const emptyFilters: WorkHubViewFilters = {
  query: "",
  areaId: null,
  projectId: null,
  status: null,
};

export function buildWorkHubViews(
  workspace: WorkHubWorkspace,
  now: string,
  filters: WorkHubViewFilters = emptyFilters,
): WorkHubViews {
  const areas = workspace.areas.filter(
    (area) => area.deletedAt === null && area.status === "active",
  );
  const projects = workspace.projects.filter(
    (project) => project.deletedAt === null && project.status !== "archived",
  );
  const goals = workspace.goals.filter(
    (goal) => goal.deletedAt === null && goal.status !== "abandoned",
  );
  const tasks = workspace.tasks.filter((task) => task.deletedAt === null);
  const taskIds = new Set(tasks.map((task) => task.id));
  const dependencies = workspace.dependencies.filter(
    (dependency) =>
      dependency.deletedAt === null &&
      taskIds.has(dependency.taskId) &&
      taskIds.has(dependency.dependsOnTaskId),
  );
  const protectedAreaIds = areas
    .filter((area) => area.name === "RHIA" || area.name === "Shadow Grown")
    .map((area) => area.id);
  const priorities = rankTasksByPriority(tasks, dependencies, { now, protectedAreaIds });
  const priorityByTaskId = new Map(priorities.map((priority) => [priority.taskId, priority]));
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const goalById = new Map(goals.map((goal) => [goal.id, goal]));
  const normalizedQuery = filters.query.trim().toLocaleLowerCase("de-DE");
  const matchesFilters = (view: WorkHubTaskView): boolean => {
    if (filters.areaId !== null && view.task.areaId !== filters.areaId) {
      return false;
    }
    if (filters.projectId !== null && view.task.projectId !== filters.projectId) {
      return false;
    }
    if (filters.status !== null && view.task.status !== filters.status) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return [
      view.task.title,
      view.task.description ?? "",
      view.areaName,
      view.projectTitle ?? "",
      view.goalTitle ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("de-DE")
      .includes(normalizedQuery);
  };

  const all = priorities
    .flatMap((priority): WorkHubTaskView[] => {
      const task = tasks.find((candidate) => candidate.id === priority.taskId);
      if (!task) {
        return [];
      }
      return [
        {
          task,
          areaName: areaById.get(task.areaId)?.name ?? "Unbekannter Bereich",
          projectTitle: task.projectId ? (projectById.get(task.projectId)?.title ?? null) : null,
          goalTitle: task.goalId ? (goalById.get(task.goalId)?.title ?? null) : null,
          priority: priorityByTaskId.get(task.id) ?? priority,
        },
      ];
    })
    .filter(matchesFilters);

  return {
    all,
    inbox: all.filter((view) => view.task.status === "inbox"),
    focus: all
      .filter(
        (view) =>
          !view.priority.blocked &&
          view.task.status !== "completed" &&
          view.task.status !== "discarded",
      )
      .slice(0, 5),
    projects: projects
      .filter((project) => filters.areaId === null || project.areaId === filters.areaId)
      .map((project) => ({
        project,
        areaName: areaById.get(project.areaId)?.name ?? "Unbekannter Bereich",
        tasks: all.filter((view) => view.task.projectId === project.id),
      }))
      .filter((projectView) => (normalizedQuery ? projectView.tasks.length > 0 : true)),
  };
}
