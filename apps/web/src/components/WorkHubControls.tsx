import type { Task, TaskImportance, TaskStatus } from "@rhia/domain";
import { type FormEvent, useState } from "react";
import type { LocalWorkHubSnapshot } from "../application/localWorkHubService";
import styles from "./WorkHubControls.module.css";

export interface ConfirmedTaskDraft {
  areaId: string;
  projectId: string | null;
  title: string;
  importance: TaskImportance;
}

export interface TaskCorrection {
  title: string;
  status: TaskStatus;
}

export interface WorkHubControlsProps {
  snapshot: LocalWorkHubSnapshot;
  onCreateConfirmedTask: (draft: ConfirmedTaskDraft) => void | Promise<void>;
  onUpdateTask: (task: Task, correction: TaskCorrection) => void | Promise<void>;
  onSetManualPriority: (task: Task, rank: number) => void | Promise<void>;
  onClearManualPriority: (task: Task) => void | Promise<void>;
  onTrashTask: (task: Task) => void | Promise<void>;
  onRestoreTask: (task: Task) => void | Promise<void>;
}

const editableStatuses: Array<{ value: TaskStatus; label: string }> = [
  { value: "inbox", label: "Inbox" },
  { value: "planned", label: "Geplant" },
  { value: "in-progress", label: "In Arbeit" },
  { value: "completed", label: "Erledigt" },
  { value: "discarded", label: "Verworfen" },
];

function TaskMaintenanceRow({
  task,
  onUpdateTask,
  onSetManualPriority,
  onClearManualPriority,
  onTrashTask,
}: Pick<
  WorkHubControlsProps,
  "onUpdateTask" | "onSetManualPriority" | "onClearManualPriority" | "onTrashTask"
> & { task: Task }) {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [rank, setRank] = useState(String(task.manualPriority?.rank ?? 1));
  const [manualConfirmed, setManualConfirmed] = useState(false);

  return (
    <li className={styles.taskRow}>
      <label>
        <span>Titel</span>
        <input value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
      </label>
      <label>
        <span>Status</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.currentTarget.value as TaskStatus)}
        >
          {task.status === "blocked" ? <option value="blocked">Blockiert</option> : null}
          {editableStatuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => void onUpdateTask(task, { title, status })}>
        Korrektur speichern
      </button>
      <div className={styles.manualPriority}>
        <label>
          <span>Manueller Rang</span>
          <input
            type="number"
            min="1"
            value={rank}
            onChange={(event) => setRank(event.currentTarget.value)}
          />
        </label>
        <label className={styles.confirmation}>
          <input
            type="checkbox"
            checked={manualConfirmed}
            onChange={(event) => setManualConfirmed(event.currentTarget.checked)}
          />
          Rang ausdrücklich bestätigen
        </label>
        <button
          type="button"
          disabled={!manualConfirmed || Number(rank) < 1}
          onClick={() => void onSetManualPriority(task, Number(rank))}
        >
          Rang setzen
        </button>
        {task.manualPriority ? (
          <button type="button" onClick={() => void onClearManualPriority(task)}>
            Rang entfernen
          </button>
        ) : null}
      </div>
      <button className={styles.dangerButton} type="button" onClick={() => void onTrashTask(task)}>
        In Papierkorb
      </button>
    </li>
  );
}

export function WorkHubControls({
  snapshot,
  onCreateConfirmedTask,
  onUpdateTask,
  onSetManualPriority,
  onClearManualPriority,
  onTrashTask,
  onRestoreTask,
}: WorkHubControlsProps) {
  const firstAreaId = snapshot.workspace.areas[0]?.id ?? "";
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState(firstAreaId);
  const [projectId, setProjectId] = useState("");
  const [importance, setImportance] = useState<TaskImportance>("medium");
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmed || !title.trim() || !areaId) {
      return;
    }
    void Promise.resolve(
      onCreateConfirmedTask({
        areaId,
        projectId: projectId || null,
        title: title.trim(),
        importance,
      }),
    ).then(() => {
      setTitle("");
      setConfirmed(false);
    });
  };

  return (
    <section className={styles.panel} aria-labelledby="work-hub-input-title">
      <header>
        <p>Bestätigte Eingabe</p>
        <h2 id="work-hub-input-title">Aufgabe übernehmen</h2>
      </header>

      <form className={styles.createForm} onSubmit={handleSubmit}>
        <label className={styles.wideField}>
          <span>Aufgabe</span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            placeholder="Was ist zu tun?"
          />
        </label>
        <label>
          <span>Bereich</span>
          <select
            required
            value={areaId}
            onChange={(event) => {
              setAreaId(event.currentTarget.value);
              setProjectId("");
            }}
          >
            {snapshot.workspace.areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Projekt</span>
          <select value={projectId} onChange={(event) => setProjectId(event.currentTarget.value)}>
            <option value="">Ohne Projekt</option>
            {snapshot.workspace.projects
              .filter((project) => project.areaId === areaId)
              .map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span>Wichtigkeit</span>
          <select
            value={importance}
            onChange={(event) => setImportance(event.currentTarget.value as TaskImportance)}
          >
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
          </select>
        </label>
        <label className={`${styles.confirmation} ${styles.wideField}`}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.currentTarget.checked)}
          />
          Ich bestätige ausdrücklich, dass RHIA diese reale Aufgabe lokal übernehmen darf.
        </label>
        <button
          className={styles.wideField}
          type="submit"
          disabled={!confirmed || !title.trim() || !areaId}
        >
          Bestätigte Aufgabe speichern
        </button>
      </form>

      <details className={styles.maintenance}>
        <summary>Korrektur, manuelle Priorität und Papierkorb</summary>
        <ul>
          {snapshot.workspace.tasks.map((task) => (
            <TaskMaintenanceRow
              key={task.id}
              task={task}
              onUpdateTask={onUpdateTask}
              onSetManualPriority={onSetManualPriority}
              onClearManualPriority={onClearManualPriority}
              onTrashTask={onTrashTask}
            />
          ))}
        </ul>
        {snapshot.trash.tasks.length > 0 ? (
          <div className={styles.trash}>
            <h3>Papierkorb</h3>
            {snapshot.trash.tasks.map((task) => (
              <div key={task.id}>
                <span>{task.title}</span>
                <button type="button" onClick={() => void onRestoreTask(task)}>
                  Wiederherstellen
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </details>
    </section>
  );
}
