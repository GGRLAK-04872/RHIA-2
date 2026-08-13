import type { Task, TaskImportance, TaskMoneyImpact } from "@rhia/domain";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { type LocalWorkHubSnapshot, localWorkHubService } from "../application/localWorkHubService";
import { buildWorkHubViews, type WorkHubTaskView } from "../application/workHubView";
import styles from "./BusinessCockpitPanel.module.css";

export interface BusinessCockpitPanelProps {
  voiceTaskDraft?: string | null;
  onVoiceTaskDraftConsumed?: () => void;
}

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

function formatDate(timestamp: string | null): string | null {
  if (!timestamp) {
    return null;
  }
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(new Date(timestamp));
}

function formatEuro(cents: number | null): string | null {
  if (cents === null) {
    return null;
  }
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function CockpitTask({
  view,
  onComplete,
}: {
  view: WorkHubTaskView;
  onComplete: (task: Task) => void;
}) {
  return (
    <article className={styles.task} data-blocked={view.priority.blocked || undefined}>
      <div>
        <p>
          {view.areaName}
          {view.projectTitle ? ` · ${view.projectTitle}` : ""}
        </p>
        <h4>{view.task.title}</h4>
      </div>
      <div className={styles.taskMeta}>
        <span>Rang {view.priority.rank}</span>
        {view.task.dueAt ? <span>Frist {formatDate(view.task.dueAt)}</span> : null}
        {view.task.expectedIncomeCents !== null ? (
          <span>{formatEuro(view.task.expectedIncomeCents)}</span>
        ) : null}
      </div>
      <p className={styles.reason}>{view.priority.explanation}</p>
      {view.priority.blocked ? (
        <p className={styles.blockedReason}>
          Blockiert: {view.task.blockedReason ?? "Offene Abhängigkeit"}
        </p>
      ) : null}
      {view.task.status !== "completed" && view.task.status !== "discarded" ? (
        <button type="button" onClick={() => onComplete(view.task)}>
          Erledigt
        </button>
      ) : null}
    </article>
  );
}

export function BusinessCockpitPanel({
  voiceTaskDraft = null,
  onVoiceTaskDraftConsumed,
}: BusinessCockpitPanelProps) {
  const [snapshot, setSnapshot] = useState<LocalWorkHubSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [importance, setImportance] = useState<TaskImportance>("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [moneyImpact, setMoneyImpact] = useState<TaskMoneyImpact>("none");
  const [expectedIncomeEuro, setExpectedIncomeEuro] = useState("");
  const [expectedIncomeDate, setExpectedIncomeDate] = useState("");
  const [blockedReason, setBlockedReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const run = async (
    operation: () => Promise<LocalWorkHubSnapshot>,
    message?: string,
  ): Promise<boolean> => {
    try {
      setError(null);
      setSuccess(null);
      setSnapshot(await operation());
      if (message) {
        setSuccess(message);
      }
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Aktion fehlgeschlagen.");
      return false;
    }
  };

  useEffect(() => {
    let active = true;
    void localWorkHubService
      .initialize()
      .then((nextSnapshot) => {
        if (active) {
          setSnapshot(nextSnapshot);
          setAreaId(nextSnapshot.workspace.areas[0]?.id ?? "");
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Firmen-Cockpit nicht verfügbar.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!voiceTaskDraft) {
      return;
    }
    setTitle(voiceTaskDraft);
    onVoiceTaskDraftConsumed?.();
  }, [voiceTaskDraft, onVoiceTaskDraftConsumed]);

  const views = useMemo(
    () =>
      snapshot
        ? buildWorkHubViews(snapshot.workspace, new Date().toISOString())
        : { all: [], inbox: [], focus: [], projects: [] },
    [snapshot],
  );
  const activeTasks = views.all.filter(
    (view) => view.task.status !== "completed" && view.task.status !== "discarded",
  );
  const moneyTasks = activeTasks
    .filter((view) => view.task.moneyImpact !== "none" || view.task.expectedIncomeCents !== null)
    .slice(0, 3);
  const blockedTasks = activeTasks.filter((view) => view.priority.blocked).slice(0, 3);
  const decisions = activeTasks.filter((view) => view.task.status === "inbox").slice(0, 3);

  const completeTask = (task: Task) =>
    run(
      () =>
        localWorkHubService.updateTask(task.id, task.revision, {
          areaId: task.areaId,
          projectId: task.projectId,
          goalId: task.goalId,
          title: task.title,
          description: task.description,
          status: "completed",
          dueAt: task.dueAt,
          importance: task.importance,
          estimatedMinutes: task.estimatedMinutes,
          moneyImpact: task.moneyImpact,
          expectedIncomeCents: task.expectedIncomeCents,
          expectedIncomeAt: task.expectedIncomeAt,
          blockedReason: null,
        }),
      `„${task.title}“ wurde erledigt.`,
    );

  const submitQuickTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!snapshot || !confirmed || !title.trim() || !areaId) {
      return;
    }
    void run(
      () =>
        localWorkHubService.createConfirmedTask(
          {
            areaId,
            projectId: projectId || null,
            goalId: null,
            title: title.trim(),
            description: null,
            status: blockedReason.trim() ? "blocked" : "planned",
            dueAt: dateInputToIso(dueDate),
            importance,
            estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
            moneyImpact,
            expectedIncomeCents:
              moneyImpact === "none" ? null : euroInputToCents(expectedIncomeEuro),
            expectedIncomeAt: moneyImpact === "none" ? null : dateInputToIso(expectedIncomeDate),
            blockedReason: blockedReason.trim() || null,
          },
          {
            actor: "sir",
            explicitlyConfirmed: true,
            confirmedAt: new Date().toISOString(),
          },
        ),
      `„${title.trim()}“ wurde lokal übernommen.`,
    ).then((completed) => {
      if (!completed) {
        return;
      }
      setTitle("");
      setProjectId("");
      setDueDate("");
      setImportance("medium");
      setEstimatedMinutes("");
      setMoneyImpact("none");
      setExpectedIncomeEuro("");
      setExpectedIncomeDate("");
      setBlockedReason("");
      setConfirmed(false);
    });
  };

  if (!snapshot) {
    return (
      <section className={styles.loading} aria-busy={!error} role={error ? "alert" : undefined}>
        {error
          ? `Firmen-Cockpit konnte nicht geladen werden: ${error}`
          : "Firmen-Cockpit wird lokal geladen …"}
      </section>
    );
  }

  return (
    <section className={styles.cockpit} aria-labelledby="business-cockpit-title">
      <header className={styles.header}>
        <div>
          <p>RH-Produktion · Betriebsstart</p>
          <h3 id="business-cockpit-title">Was ist jetzt wichtig?</h3>
        </div>
        <span>{activeTasks.length} offene Aufgaben</span>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className={styles.success} role="status">
          {success}
        </p>
      ) : null}

      <section className={styles.focusCard} aria-labelledby="focus-title">
        <div className={styles.sectionTitle}>
          <div>
            <span>Heute</span>
            <h4 id="focus-title">Nächster sinnvoller Schritt</h4>
          </div>
          <strong>
            {views.focus.length > 0 ? `Rang ${views.focus[0]?.priority.rank}` : "Frei"}
          </strong>
        </div>
        {views.focus.length > 0 ? (
          views.focus
            .slice(0, 3)
            .map((view) => <CockpitTask key={view.task.id} view={view} onComplete={completeTask} />)
        ) : (
          <p className={styles.empty}>Noch keine priorisierte Aufgabe vorhanden.</p>
        )}
      </section>

      <div className={styles.summaryGrid}>
        <section aria-labelledby="money-title">
          <div className={styles.sectionTitle}>
            <div>
              <span>Wirkung</span>
              <h4 id="money-title">Geld / Geschäft</h4>
            </div>
            <strong>{moneyTasks.length}</strong>
          </div>
          {moneyTasks.length > 0 ? (
            moneyTasks.map((view) => (
              <CockpitTask key={view.task.id} view={view} onComplete={completeTask} />
            ))
          ) : (
            <p className={styles.empty}>Noch keine Aufgabe mit Geldwirkung.</p>
          )}
        </section>

        <section aria-labelledby="blocked-title">
          <div className={styles.sectionTitle}>
            <div>
              <span>Handlungsbedarf</span>
              <h4 id="blocked-title">Blockiert</h4>
            </div>
            <strong>{blockedTasks.length}</strong>
          </div>
          {blockedTasks.length > 0 ? (
            blockedTasks.map((view) => (
              <CockpitTask key={view.task.id} view={view} onComplete={completeTask} />
            ))
          ) : (
            <p className={styles.empty}>Keine aktive Blockade.</p>
          )}
        </section>

        <section aria-labelledby="decision-title">
          <div className={styles.sectionTitle}>
            <div>
              <span>Kontrolle</span>
              <h4 id="decision-title">Entscheidung von Sir</h4>
            </div>
            <strong>{decisions.length}</strong>
          </div>
          {decisions.length > 0 ? (
            decisions.map((view) => (
              <CockpitTask key={view.task.id} view={view} onComplete={completeTask} />
            ))
          ) : (
            <p className={styles.empty}>Keine ungeklärte Inbox-Aufgabe.</p>
          )}
        </section>

        <section aria-labelledby="projects-title">
          <div className={styles.sectionTitle}>
            <div>
              <span>Überblick</span>
              <h4 id="projects-title">Projekte</h4>
            </div>
            <strong>{views.projects.length}</strong>
          </div>
          <div className={styles.projectList}>
            {views.projects.length > 0 ? (
              views.projects.slice(0, 4).map((view) => (
                <article key={view.project.id}>
                  <span>{view.areaName}</span>
                  <h5>{view.project.title}</h5>
                  <p>{view.tasks[0]?.task.title ?? "Nächsten Schritt festlegen"}</p>
                </article>
              ))
            ) : (
              <p className={styles.empty}>Noch kein Projekt angelegt.</p>
            )}
          </div>
        </section>
      </div>

      <section className={styles.quickEntry} aria-labelledby="quick-entry-title">
        <div className={styles.sectionTitle}>
          <div>
            <span>Schnelleingabe</span>
            <h4 id="quick-entry-title">Neue Arbeit übernehmen</h4>
          </div>
        </div>
        <form onSubmit={submitQuickTask}>
          <label className={styles.wide}>
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
            <span>Frist</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.currentTarget.value)}
            />
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
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(event.currentTarget.value)}
            />
          </label>
          <label>
            <span>Geldwirkung</span>
            <select
              value={moneyImpact}
              onChange={(event) => setMoneyImpact(event.currentTarget.value as TaskMoneyImpact)}
            >
              <option value="none">Keine</option>
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
            </select>
          </label>
          {moneyImpact !== "none" ? (
            <>
              <label>
                <span>Erwarteter Geldeingang in Euro</span>
                <input
                  inputMode="decimal"
                  value={expectedIncomeEuro}
                  onChange={(event) => setExpectedIncomeEuro(event.currentTarget.value)}
                />
              </label>
              <label>
                <span>Geldeingang bis</span>
                <input
                  type="date"
                  value={expectedIncomeDate}
                  onChange={(event) => setExpectedIncomeDate(event.currentTarget.value)}
                />
              </label>
            </>
          ) : null}
          <label className={styles.wide}>
            <span>Blockade – optional</span>
            <input
              value={blockedReason}
              onChange={(event) => setBlockedReason(event.currentTarget.value)}
              placeholder="Was fehlt, bevor es weitergeht?"
            />
          </label>
          <label className={`${styles.confirmation} ${styles.wide}`}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.currentTarget.checked)}
            />
            <span>Ich, Sir, bestätige die Übernahme dieser Aufgabe.</span>
          </label>
          <button
            className={styles.wide}
            type="submit"
            disabled={!confirmed || !title.trim() || !areaId}
          >
            Aufgabe bestätigen
          </button>
        </form>
      </section>

      <footer className={styles.localFooter}>
        <span>Local-first</span>
        <span>IndexedDB</span>
        <span>OpenAI API deaktiviert</span>
        <span>Keine Audio-Speicherung</span>
      </footer>
    </section>
  );
}
