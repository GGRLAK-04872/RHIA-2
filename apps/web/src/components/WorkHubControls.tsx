import type { Task, TaskImportance, TaskMoneyImpact, TaskStatus } from "@rhia/domain";
import { type FormEvent, useState } from "react";
import type { LocalWorkHubSnapshot } from "../application/localWorkHubService";
import styles from "./WorkHubControls.module.css";

export interface ConfirmedTaskDraft {
  areaId: string;
  projectId: string | null;
  goalId: string | null;
  title: string;
  status: TaskStatus;
  dueAt: string | null;
  importance: TaskImportance;
  estimatedMinutes: number | null;
  moneyImpact: TaskMoneyImpact;
  expectedIncomeCents: number | null;
  expectedIncomeAt: string | null;
}

export interface ProjectDraft {
  areaId: string;
  title: string;
}

export interface GoalDraft {
  projectId: string;
  title: string;
}

export interface TaskCorrection {
  title: string;
  status: TaskStatus;
}

export interface WorkHubControlsProps {
  snapshot: LocalWorkHubSnapshot;
  onCreateProject: (draft: ProjectDraft) => void | Promise<void>;
  onCreateGoal: (draft: GoalDraft) => void | Promise<void>;
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

function dateInputToIso(value: string): string | null {
  return value ? `${value}T12:00:00.000Z` : null;
}

function euroInputToCents(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

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
  onCreateProject,
  onCreateGoal,
  onCreateConfirmedTask,
  onUpdateTask,
  onSetManualPriority,
  onClearManualPriority,
  onTrashTask,
  onRestoreTask,
}: WorkHubControlsProps) {
  const firstAreaId = snapshot.workspace.areas[0]?.id ?? "";
  const [projectAreaId, setProjectAreaId] = useState(firstAreaId);
  const [projectTitle, setProjectTitle] = useState("");
  const [goalProjectId, setGoalProjectId] = useState(snapshot.workspace.projects[0]?.id ?? "");
  const [goalTitle, setGoalTitle] = useState("");
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState(firstAreaId);
  const [projectId, setProjectId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [status, setStatus] = useState<TaskStatus>("planned");
  const [importance, setImportance] = useState<TaskImportance>("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [moneyImpact, setMoneyImpact] = useState<TaskMoneyImpact>("none");
  const [expectedIncomeEuro, setExpectedIncomeEuro] = useState("");
  const [expectedIncomeDate, setExpectedIncomeDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleProjectSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectAreaId || !projectTitle.trim()) {
      return;
    }
    void Promise.resolve(
      onCreateProject({ areaId: projectAreaId, title: projectTitle.trim() }),
    ).then(() => setProjectTitle(""));
  };

  const handleGoalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!goalProjectId || !goalTitle.trim()) {
      return;
    }
    void Promise.resolve(onCreateGoal({ projectId: goalProjectId, title: goalTitle.trim() })).then(
      () => setGoalTitle(""),
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmed || !title.trim() || !areaId) {
      return;
    }
    void Promise.resolve(
      onCreateConfirmedTask({
        areaId,
        projectId: projectId || null,
        goalId: goalId || null,
        title: title.trim(),
        status,
        dueAt: dateInputToIso(dueDate),
        importance,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        moneyImpact,
        expectedIncomeCents: moneyImpact === "none" ? null : euroInputToCents(expectedIncomeEuro),
        expectedIncomeAt: moneyImpact === "none" ? null : dateInputToIso(expectedIncomeDate),
      }),
    ).then(() => {
      setTitle("");
      setGoalId("");
      setStatus("planned");
      setImportance("medium");
      setEstimatedMinutes("");
      setDueDate("");
      setMoneyImpact("none");
      setExpectedIncomeEuro("");
      setExpectedIncomeDate("");
      setConfirmed(false);
    });
  };

  const projectGoals = snapshot.workspace.goals.filter((goal) => goal.projectId === projectId);

  return (
    <section className={styles.panel} aria-labelledby="work-hub-input-title">
      <header>
        <p>Arbeitsstruktur</p>
        <h2>Projekt und Ziel anlegen</h2>
      </header>

      <form className={styles.createForm} onSubmit={handleProjectSubmit}>
        <label>
          <span>Projektbereich</span>
          <select
            required
            value={projectAreaId}
            onChange={(event) => setProjectAreaId(event.currentTarget.value)}
          >
            {snapshot.workspace.areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.wideField}>
          <span>Projekttitel</span>
          <input
            required
            value={projectTitle}
            onChange={(event) => setProjectTitle(event.currentTarget.value)}
            placeholder="Projektname"
          />
        </label>
        <button
          className={styles.wideField}
          type="submit"
          disabled={!projectAreaId || !projectTitle.trim()}
        >
          Projekt anlegen
        </button>
      </form>

      <form className={styles.createForm} onSubmit={handleGoalSubmit}>
        <label>
          <span>Zielprojekt</span>
          <select
            required
            value={goalProjectId}
            onChange={(event) => setGoalProjectId(event.currentTarget.value)}
          >
            <option value="">Projekt wählen</option>
            {snapshot.workspace.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.wideField}>
          <span>Zieltitel</span>
          <input
            required
            value={goalTitle}
            onChange={(event) => setGoalTitle(event.currentTarget.value)}
            placeholder="Zielname"
          />
        </label>
        <button
          className={styles.wideField}
          type="submit"
          disabled={!goalProjectId || !goalTitle.trim()}
        >
          Ziel anlegen
        </button>
      </form>

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
              setGoalId("");
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
          <select
            value={projectId}
            onChange={(event) => {
              setProjectId(event.currentTarget.value);
              setGoalId("");
            }}
          >
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
          <span>Ziel</span>
          <select
            value={goalId}
            disabled={!projectId}
            onChange={(event) => setGoalId(event.currentTarget.value)}
          >
            <option value="">Ohne Ziel</option>
            {projectGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.currentTarget.value as TaskStatus)}
          >
            {editableStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
        <label>
          <span>Aufwand in Minuten</span>
          <input
            type="number"
            min="1"
            step="1"
            value={estimatedMinutes}
            onChange={(event) => setEstimatedMinutes(event.currentTarget.value)}
            placeholder="z. B. 30"
          />
        </label>
        <label>
          <span>Frist</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.currentTarget.value)}
          />
        </label>
        <label>
          <span>Geldwirkung</span>
          <select
            value={moneyImpact}
            onChange={(event) => {
              const next = event.currentTarget.value as TaskMoneyImpact;
              setMoneyImpact(next);
              if (next === "none") {
                setExpectedIncomeEuro("");
                setExpectedIncomeDate("");
              }
            }}
          >
            <option value="none">Keine</option>
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
          </select>
        </label>
        <label>
          <span>Erwarteter Geldeingang in Euro</span>
          <input
            type="number"
            min="0"
            step="0.01"
            disabled={moneyImpact === "none"}
            value={expectedIncomeEuro}
            onChange={(event) => setExpectedIncomeEuro(event.currentTarget.value)}
            placeholder="z. B. 100,00"
          />
        </label>
        <label>
          <span>Erwarteter Geldeingang bis</span>
          <input
            type="date"
            disabled={moneyImpact === "none"}
            value={expectedIncomeDate}
            onChange={(event) => setExpectedIncomeDate(event.currentTarget.value)}
          />
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
