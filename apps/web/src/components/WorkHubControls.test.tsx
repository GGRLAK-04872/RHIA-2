import { createArea, createProject, createTask } from "@rhia/domain";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LocalWorkHubSnapshot } from "../application/localWorkHubService";
import { WorkHubControls } from "./WorkHubControls";

const timestamp = "2026-08-09T08:00:00.000Z";
const ids = {
  area: "11111111-1111-4111-8111-111111111111",
  project: "22222222-2222-4222-8222-222222222222",
  task: "33333333-3333-4333-8333-333333333333",
  trash: "44444444-4444-4444-8444-444444444444",
} as const;

function snapshot(): LocalWorkHubSnapshot {
  const area = createArea({ name: "RHIA" }, { id: ids.area, timestamp });
  const project = createProject(
    { areaId: area.id, title: "RHIA 2.0" },
    { id: ids.project, timestamp },
  );
  const task = createTask(
    { areaId: area.id, projectId: project.id, title: "Aktive Aufgabe", status: "planned" },
    { id: ids.task, timestamp },
  );
  const trash = {
    ...createTask({ areaId: area.id, title: "Gelöschte Aufgabe" }, { id: ids.trash, timestamp }),
    revision: 2,
    deletedAt: "2026-08-09T09:00:00.000Z",
  };
  return {
    workspace: { areas: [area], projects: [project], goals: [], tasks: [task], dependencies: [] },
    trash: { projects: [], goals: [], tasks: [trash], dependencies: [] },
    auditEntries: [],
  };
}

function handlers() {
  return {
    onCreateConfirmedTask: vi.fn(),
    onUpdateTask: vi.fn(),
    onSetManualPriority: vi.fn(),
    onClearManualPriority: vi.fn(),
    onTrashTask: vi.fn(),
    onRestoreTask: vi.fn(),
  };
}

describe("WorkHubControls", () => {
  it("submits a real task only after visible explicit confirmation", async () => {
    const callbacks = handlers();
    render(<WorkHubControls snapshot={snapshot()} {...callbacks} />);
    const saveButton = screen.getByRole("button", { name: "Bestätigte Aufgabe speichern" });

    fireEvent.change(screen.getByRole("textbox", { name: "Aufgabe" }), {
      target: { value: "Neue reale Aufgabe" },
    });
    expect(saveButton).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /Ich bestätige ausdrücklich, dass RHIA diese reale Aufgabe lokal übernehmen darf/,
      }),
    );
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(callbacks.onCreateConfirmedTask).toHaveBeenCalledWith({
        areaId: ids.area,
        projectId: null,
        title: "Neue reale Aufgabe",
        importance: "medium",
      }),
    );
  });

  it("exposes correction, protected manual rank, trash and restore actions", () => {
    const callbacks = handlers();
    render(<WorkHubControls snapshot={snapshot()} {...callbacks} />);
    fireEvent.click(screen.getByText("Korrektur, manuelle Priorität und Papierkorb"));

    fireEvent.change(screen.getByDisplayValue("Aktive Aufgabe"), {
      target: { value: "Korrigierte Aufgabe" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Korrektur speichern" }));
    expect(callbacks.onUpdateTask).toHaveBeenCalledWith(expect.objectContaining({ id: ids.task }), {
      title: "Korrigierte Aufgabe",
      status: "planned",
    });

    const rankButton = screen.getByRole("button", { name: "Rang setzen" });
    expect(rankButton).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Rang ausdrücklich bestätigen" }));
    fireEvent.click(rankButton);
    expect(callbacks.onSetManualPriority).toHaveBeenCalledWith(
      expect.objectContaining({ id: ids.task }),
      1,
    );

    fireEvent.click(screen.getByRole("button", { name: "In Papierkorb" }));
    expect(callbacks.onTrashTask).toHaveBeenCalledWith(expect.objectContaining({ id: ids.task }));
    fireEvent.click(screen.getByRole("button", { name: "Wiederherstellen" }));
    expect(callbacks.onRestoreTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: ids.trash }),
    );
  });
});
