import {
  createArea,
  createGoal,
  createProject,
  createTask,
  createTaskDependency,
} from "@rhia/domain";
import { describe, expect, it } from "vitest";
import { buildWorkHubViews, type WorkHubWorkspace } from "./workHubView";

const timestamp = "2026-08-09T08:00:00.000Z";
const ids = {
  area: "11111111-1111-4111-8111-111111111111",
  project: "22222222-2222-4222-8222-222222222222",
  goal: "33333333-3333-4333-8333-333333333333",
  inbox: "44444444-4444-4444-8444-444444444444",
  focus: "55555555-5555-4555-8555-555555555555",
  blocked: "66666666-6666-4666-8666-666666666666",
  dependency: "77777777-7777-4777-8777-777777777777",
} as const;

function workspace(): WorkHubWorkspace {
  const area = createArea({ name: "RHIA" }, { id: ids.area, timestamp });
  const project = createProject(
    { areaId: area.id, title: "RHIA 2.0" },
    { id: ids.project, timestamp },
  );
  const goal = createGoal(
    { projectId: project.id, title: "Arbeitszentrale" },
    { id: ids.goal, timestamp },
  );
  const inbox = createTask(
    { areaId: area.id, title: "Eingang sortieren" },
    { id: ids.inbox, timestamp },
  );
  const focus = createTask(
    {
      areaId: area.id,
      projectId: project.id,
      goalId: goal.id,
      title: "Priorität erklären",
      status: "planned",
      importance: "high",
      dueAt: "2026-08-09T12:00:00.000Z",
    },
    { id: ids.focus, timestamp },
  );
  const blocked = createTask(
    {
      areaId: area.id,
      projectId: project.id,
      title: "Gerätetest",
      status: "planned",
    },
    { id: ids.blocked, timestamp },
  );
  const dependency = createTaskDependency(
    { taskId: blocked.id, dependsOnTaskId: focus.id },
    { id: ids.dependency, timestamp },
  );
  return {
    areas: [area],
    projects: [project],
    goals: [goal],
    tasks: [inbox, focus, blocked],
    dependencies: [dependency],
  };
}

describe("stage 3.6 work hub views", () => {
  it("builds inbox, project and unblocked focus views", () => {
    const views = buildWorkHubViews(workspace(), "2026-08-09T10:00:00.000Z");

    expect(views.inbox.map((view) => view.task.id)).toEqual([ids.inbox]);
    expect(views.focus.map((view) => view.task.id)).toEqual([ids.focus, ids.inbox]);
    expect(views.all.find((view) => view.task.id === ids.blocked)?.priority).toMatchObject({
      blocked: true,
      blockedByTaskIds: [ids.focus],
    });
    expect(views.projects[0]).toMatchObject({
      areaName: "RHIA",
      project: { id: ids.project, title: "RHIA 2.0" },
    });
  });

  it("filters and searches across task, area, project and goal labels", () => {
    const views = buildWorkHubViews(workspace(), "2026-08-09T10:00:00.000Z", {
      query: "arbeitszentrale",
      areaId: ids.area,
      projectId: ids.project,
      status: "planned",
    });

    expect(views.all.map((view) => view.task.id)).toEqual([ids.focus]);
  });
});
