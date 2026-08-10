import type { TaskImportance, TaskMoneyImpact, TaskStatus } from "@rhia/domain";
import { useMemo, useState } from "react";
import {
  buildWorkHubViews,
  type WorkHubTaskView,
  type WorkHubWorkspace,
} from "../application/workHubView";
import styles from "./WorkHubPanel.module.css";

type WorkHubTab = "inbox" | "projects" | "focus" | "all";

export interface WorkHubPanelProps {
  workspace: WorkHubWorkspace;
  now?: string;
}

const statusLabels: Record<TaskStatus, string> = {
  inbox: "Inbox",
  planned: "Geplant",
  "in-progress": "In Arbeit",
  blocked: "Blockiert",
  completed: "Erledigt",
  discarded: "Verworfen",
};

const importanceLabels: Record<TaskImportance, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

const moneyImpactLabels: Record<TaskMoneyImpact, string> = {
  none: "Keine",
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

const tabs: Array<{ id: WorkHubTab; label: string }> = [
  { id: "inbox", label: "Inbox" },
  { id: "projects", label: "Projekte" },
  { id: "focus", label: "Fokus" },
  { id: "all", label: "Alle" },
];

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

function TaskCard({ view, showPriority }: { view: WorkHubTaskView; showPriority: boolean }) {
  return (
    <article className={styles.taskCard} data-blocked={view.priority.blocked || undefined}>
      <div className={styles.taskHeader}>
        <div>
          <p className={styles.taskContext}>
            {view.areaName}
            {view.projectTitle ? ` · ${view.projectTitle}` : " · Ohne Projekt"}
            {view.goalTitle ? ` · Ziel: ${view.goalTitle}` : ""}
          </p>
          <h4>{view.task.title}</h4>
        </div>
        {showPriority ? (
          <span
            className={styles.rankBadge}
            data-manual={view.priority.source === "manual" || undefined}
          >
            #{view.priority.rank}
          </span>
        ) : null}
      </div>

      {view.task.description ? <p className={styles.description}>{view.task.description}</p> : null}

      <div className={styles.metaRow}>
        <span>Status: {statusLabels[view.task.status]}</span>
        <span>Wichtigkeit: {importanceLabels[view.task.importance]}</span>
        {view.task.dueAt ? <span>Frist: {formatDate(view.task.dueAt)}</span> : null}
        {view.task.estimatedMinutes ? <span>Aufwand: {view.task.estimatedMinutes} Min.</span> : null}
        <span>Geldwirkung: {moneyImpactLabels[view.task.moneyImpact]}</span>
        {view.task.expectedIncomeCents !== null ? (
          <span>Geldeingang: {formatEuro(view.task.expectedIncomeCents)}</span>
        ) : null}
        {view.task.expectedIncomeAt ? (
          <span>Geldeingang bis: {formatDate(view.task.expectedIncomeAt)}</span>
        ) : null}
      </div>

      {view.priority.blocked ? (
        <p className={styles.blockage} role="status">
          Blockiert:{" "}
          {view.priority.factors.find((factor) => factor.key === "blockage")?.explanation}
        </p>
      ) : null}
      {showPriority ? (
        <p className={styles.priorityReason}>
          {view.priority.source === "manual" ? "Manuell geschützt · " : "Automatisch · "}
          {view.priority.explanation}
        </p>
      ) : null}
    </article>
  );
}

export function WorkHubPanel({ workspace, now = new Date().toISOString() }: WorkHubPanelProps) {
  const [activeTab, setActiveTab] = useState<WorkHubTab>("inbox");
  const [query, setQuery] = useState("");
  const [areaId, setAreaId] = useState("");
  const [status, setStatus] = useState("");
  const views = useMemo(
    () =>
      buildWorkHubViews(workspace, now, {
        query,
        areaId: areaId || null,
        projectId: null,
        status: (status || null) as TaskStatus | null,
      }),
    [workspace, now, query, areaId, status],
  );
  const visibleTasks =
    activeTab === "focus" ? views.focus : activeTab === "all" ? views.all : views.inbox;

  return (
    <section className={styles.panel} aria-labelledby="work-hub-title">
      <header className={styles.header}>
        <div>
          <p className={styles.overline}>Stufe 3 · Arbeitszentrale</p>
          <h2 id="work-hub-title">Aufgaben im Blick</h2>
        </div>
        <span className={styles.localBadge}>Nur lokal</span>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Ansicht wählen">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <fieldset className={styles.filters}>
        <legend className={styles.srOnly}>Aufgaben filtern</legend>
        <label>
          <span>Suche</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Aufgabe, Projekt oder Ziel"
          />
        </label>
        <label>
          <span>Bereich</span>
          <select value={areaId} onChange={(event) => setAreaId(event.currentTarget.value)}>
            <option value="">Alle Bereiche</option>
            {workspace.areas
              .filter((area) => area.deletedAt === null && area.status === "active")
              .map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.currentTarget.value)}>
            <option value="">Alle Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <div className={styles.content} role="tabpanel">
        {activeTab === "projects" ? (
          views.projects.length > 0 ? (
            <div className={styles.projectList}>
              {views.projects.map((projectView) => (
                <section key={projectView.project.id} className={styles.projectCard}>
                  <div className={styles.projectHeader}>
                    <div>
                      <span>{projectView.areaName}</span>
                      <h3>{projectView.project.title}</h3>
                    </div>
                    <strong>{projectView.tasks.length} Aufgaben</strong>
                  </div>
                  <div className={styles.taskList}>
                    {projectView.tasks.length > 0 ? (
                      projectView.tasks.map((view) => (
                        <TaskCard key={view.task.id} view={view} showPriority={false} />
                      ))
                    ) : (
                      <p className={styles.empty}>Keine passenden Aufgaben in diesem Projekt.</p>
                    )}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Keine passenden Projekte gefunden.</p>
          )
        ) : visibleTasks.length > 0 ? (
          <div className={styles.taskList}>
            {visibleTasks.map((view) => (
              <TaskCard key={view.task.id} view={view} showPriority={activeTab === "focus"} />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            {activeTab === "inbox" ? "Die Inbox ist leer." : "Keine passenden Aufgaben gefunden."}
          </p>
        )}
      </div>
    </section>
  );
}
