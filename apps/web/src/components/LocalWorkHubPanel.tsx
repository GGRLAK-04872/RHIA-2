import { useEffect, useState } from "react";
import { type LocalWorkHubSnapshot, localWorkHubService } from "../application/localWorkHubService";
import {
  type ConfirmedTaskDraft,
  type GoalDraft,
  type ProjectDraft,
  type TaskCorrection,
  WorkHubControls,
} from "./WorkHubControls";
import { WorkHubPanel } from "./WorkHubPanel";
import styles from "./WorkHubPanel.module.css";

export function LocalWorkHubPanel() {
  const [snapshot, setSnapshot] = useState<LocalWorkHubSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (operation: () => Promise<LocalWorkHubSnapshot>) => {
    try {
      setError(null);
      setSnapshot(await operation());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Aktion fehlgeschlagen.");
    }
  };

  useEffect(() => {
    let active = true;
    void localWorkHubService
      .initialize()
      .then((nextSnapshot) => {
        if (active) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Arbeitszentrale nicht verfügbar.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error && !snapshot) {
    return (
      <section className={styles.panel} role="alert">
        Arbeitszentrale konnte nicht geladen werden: {error}
      </section>
    );
  }
  if (!snapshot) {
    return (
      <section className={styles.panel} aria-busy="true">
        Arbeitszentrale wird lokal geladen …
      </section>
    );
  }

  const createProject = (draft: ProjectDraft) =>
    run(() => localWorkHubService.createProject({ areaId: draft.areaId, title: draft.title }));
  const createGoal = (draft: GoalDraft) =>
    run(() => localWorkHubService.createGoal({ projectId: draft.projectId, title: draft.title }));
  const createConfirmedTask = (draft: ConfirmedTaskDraft) =>
    run(() =>
      localWorkHubService.createConfirmedTask(
        {
          areaId: draft.areaId,
          projectId: draft.projectId,
          title: draft.title,
          importance: draft.importance,
        },
        {
          actor: "sir",
          explicitlyConfirmed: true,
          confirmedAt: new Date().toISOString(),
        },
      ),
    );
  const updateTask = (
    task: LocalWorkHubSnapshot["workspace"]["tasks"][number],
    correction: TaskCorrection,
  ) =>
    run(() =>
      localWorkHubService.updateTask(task.id, task.revision, {
        areaId: task.areaId,
        projectId: task.projectId,
        goalId: task.goalId,
        title: correction.title,
        description: task.description,
        status: correction.status,
        dueAt: task.dueAt,
        importance: task.importance,
        estimatedMinutes: task.estimatedMinutes,
        moneyImpact: task.moneyImpact,
        expectedIncomeCents: task.expectedIncomeCents,
        expectedIncomeAt: task.expectedIncomeAt,
        blockedReason: correction.status === "blocked" ? task.blockedReason : null,
      }),
    );
  const manualDecision = () => ({
    actor: "sir" as const,
    explicitlyConfirmed: true as const,
    decidedAt: new Date().toISOString(),
    rationale: "Über die Arbeitszentrale ausdrücklich bestätigt.",
  });

  return (
    <>
      {error ? <p role="alert">Aktion fehlgeschlagen: {error}</p> : null}
      <WorkHubControls
        snapshot={snapshot}
        onCreateProject={createProject}
        onCreateGoal={createGoal}
        onCreateConfirmedTask={createConfirmedTask}
        onUpdateTask={updateTask}
        onSetManualPriority={(task, rank) =>
          run(() =>
            localWorkHubService.setTaskManualPriority(
              task.id,
              task.revision,
              rank,
              manualDecision(),
            ),
          )
        }
        onClearManualPriority={(task) =>
          run(() =>
            localWorkHubService.clearTaskManualPriority(task.id, task.revision, manualDecision()),
          )
        }
        onTrashTask={(task) =>
          run(() => localWorkHubService.moveTaskToTrash(task.id, task.revision))
        }
        onRestoreTask={(task) => run(() => localWorkHubService.restoreTask(task.id, task.revision))}
      />
      <WorkHubPanel workspace={snapshot.workspace} />
    </>
  );
}
