import type {
  Briefing,
  PlanningFeedbackReason,
  PlanningFeedbackResult,
  WorkBlock,
} from "@rhia/domain";
import { useMemo, useState } from "react";
import type {
  GeneratePlanInput,
  LocalPlanningSnapshot,
  RecordPlanningFeedbackInput,
} from "../application/localPlanningService";
import styles from "./PlanningPanel.module.css";

export interface PlanningPanelProps {
  snapshot: LocalPlanningSnapshot;
  onGeneratePlan(input: GeneratePlanInput): Promise<void>;
  onCreateEveningReview(periodStart: string, periodEnd: string): Promise<void>;
  onRecordFeedback(input: RecordPlanningFeedbackInput): Promise<void>;
  onTrashBriefing(briefing: Briefing): Promise<void>;
  onRestoreBriefing(briefing: Briefing): Promise<void>;
}

const kindLabels: Record<Briefing["kind"], string> = {
  morning: "Morgenbriefing und Tagesplan",
  week: "Wochenplanung",
  evening: "Abendrückblick",
};

const resultLabels: Record<PlanningFeedbackResult, string> = {
  completed: "Erledigt",
  partial: "Teilweise erledigt",
  skipped: "Ausgelassen",
};

const reasonLabels: Record<PlanningFeedbackReason, string> = {
  none: "Kein besonderer Grund",
  "time-too-short": "Zeit war zu kurz",
  "time-too-long": "Zeit war zu lang",
  blocked: "Blockade aufgetreten",
  "priority-wrong": "Priorität passte nicht",
  other: "Anderer Grund",
};

const blockStatusLabels: Record<WorkBlock["status"], string> = {
  proposed: "Vorgeschlagen",
  accepted: "Angenommen",
  completed: "Erledigt",
  partial: "Teilweise erledigt",
  skipped: "Ausgelassen",
};

type PlanningView = "day" | "week" | "briefings" | "feedback";

const planningViews = [
  { id: "day", label: "Tagesplan" },
  { id: "week", label: "Woche" },
  { id: "briefings", label: "Briefings" },
  { id: "feedback", label: "Feedback" },
] as const satisfies ReadonlyArray<{ id: PlanningView; label: string }>;

function localDateValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultDate(): string {
  return localDateValue();
}

function localDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function dayRange(date: string): { periodStart: string; periodEnd: string } {
  const start = localDateTime(date, "00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
}

function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(timestamp));
}

function FeedbackForm({
  block,
  onSubmit,
}: {
  block: WorkBlock;
  onSubmit(input: RecordPlanningFeedbackInput): Promise<void>;
}) {
  const [result, setResult] = useState<PlanningFeedbackResult>("completed");
  const [reason, setReason] = useState<PlanningFeedbackReason>("none");
  const [actualMinutes, setActualMinutes] = useState("");
  const [note, setNote] = useState("");

  return (
    <form
      className={styles.feedbackForm}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({
          workBlockId: block.id,
          result,
          reason,
          actualMinutes: actualMinutes ? Number(actualMinutes) : null,
          note: note.trim() || null,
        });
      }}
    >
      <label>
        <span>Ergebnis</span>
        <select
          aria-label={`Ergebnis für ${block.title}`}
          value={result}
          onChange={(event) => setResult(event.currentTarget.value as PlanningFeedbackResult)}
        >
          {Object.entries(resultLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Grund</span>
        <select
          aria-label={`Grund für ${block.title}`}
          value={reason}
          onChange={(event) => setReason(event.currentTarget.value as PlanningFeedbackReason)}
        >
          {Object.entries(reasonLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Tatsächliche Minuten</span>
        <input
          aria-label={`Tatsächliche Minuten für ${block.title}`}
          type="number"
          min="0"
          max="10080"
          value={actualMinutes}
          onChange={(event) => setActualMinutes(event.currentTarget.value)}
        />
      </label>
      <label className={styles.feedbackNote}>
        <span>Notiz</span>
        <input
          aria-label={`Notiz für ${block.title}`}
          value={note}
          maxLength={10000}
          onChange={(event) => setNote(event.currentTarget.value)}
        />
      </label>
      <button type="submit">Rückmeldung speichern</button>
    </form>
  );
}

export function PlanningPanel({
  snapshot,
  onGeneratePlan,
  onCreateEveningReview,
  onRecordFeedback,
  onTrashBriefing,
  onRestoreBriefing,
}: PlanningPanelProps) {
  const [activeView, setActiveView] = useState<PlanningView>("day");
  const [dayDate, setDayDate] = useState(defaultDate());
  const [dayStart, setDayStart] = useState("09:00");
  const [dayEnd, setDayEnd] = useState("12:00");
  const [weekStart, setWeekStart] = useState(defaultDate());
  const [weekStartTime, setWeekStartTime] = useState("18:00");
  const [weekdayMinutes, setWeekdayMinutes] = useState("120");
  const [weekendMinutes, setWeekendMinutes] = useState("60");
  const [reviewDate, setReviewDate] = useState(defaultDate());
  const briefings = useMemo(
    () =>
      snapshot.briefings.toSorted((left, right) =>
        right.generatedAt.localeCompare(left.generatedAt),
      ),
    [snapshot.briefings],
  );
  const latestBriefing = briefings[0] ?? null;
  const latestBlocks = latestBriefing
    ? snapshot.workBlocks
        .filter((block) => block.briefingId === latestBriefing.id)
        .toSorted((left, right) => left.startAt.localeCompare(right.startAt))
    : [];

  const generateDayPlan = async () => {
    const { periodStart, periodEnd } = dayRange(dayDate);
    await onGeneratePlan({
      kind: "morning",
      periodStart,
      periodEnd,
      availability: [
        {
          startAt: localDateTime(dayDate, dayStart).toISOString(),
          endAt: localDateTime(dayDate, dayEnd).toISOString(),
        },
      ],
    });
  };

  const generateWeekPlan = async () => {
    const start = localDateTime(weekStart, "00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const availability = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(date.getDate() + index);
      const dateValue = localDateValue(date);
      const minutes = Number(index < 5 ? weekdayMinutes : weekendMinutes);
      const windowStart = localDateTime(dateValue, weekStartTime);
      const windowEnd = new Date(windowStart.getTime() + minutes * 60_000);
      return minutes > 0
        ? { startAt: windowStart.toISOString(), endAt: windowEnd.toISOString() }
        : null;
    }).filter((window): window is { startAt: string; endAt: string } => window !== null);
    await onGeneratePlan({
      kind: "week",
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      availability,
    });
  };

  return (
    <section className={styles.panel} aria-labelledby="planning-title">
      <header className={styles.header}>
        <div>
          <p className={styles.overline}>Stufe 4 · Planung und Briefings</p>
          <h2 id="planning-title">Begründet planen</h2>
        </div>
        <span className={styles.localBadge}>Nur lokal</span>
      </header>

      <p className={styles.intro}>
        RHIA berücksichtigt Fristen, verfügbare Zeit, Blockaden, Abhängigkeiten und Rückmeldungen.
        Ungefähr 20 Prozent bleiben für RHIA und Shadow Grown geschützt.
      </p>

      <div className={styles.viewTabs} aria-label="Planungsbereiche" role="tablist">
        {planningViews.map((view) => (
          <button
            key={view.id}
            id={`planning-tab-${view.id}`}
            type="button"
            role="tab"
            aria-selected={activeView === view.id}
            aria-controls={`planning-view-${view.id}`}
            onClick={() => setActiveView(view.id)}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className={styles.planningForms}>
        {activeView === "day" ? (
          <form
            id="planning-view-day"
            role="tabpanel"
            aria-labelledby="planning-tab-day"
            onSubmit={(event) => {
              event.preventDefault();
              void generateDayPlan();
            }}
          >
            <h3>Morgenbriefing</h3>
            <label>
              <span>Tag</span>
              <input
                type="date"
                value={dayDate}
                onChange={(event) => setDayDate(event.currentTarget.value)}
                required
              />
            </label>
            <div className={styles.inlineFields}>
              <label>
                <span>Verfügbar ab</span>
                <input
                  type="time"
                  value={dayStart}
                  onChange={(event) => setDayStart(event.currentTarget.value)}
                  required
                />
              </label>
              <label>
                <span>Verfügbar bis</span>
                <input
                  type="time"
                  value={dayEnd}
                  onChange={(event) => setDayEnd(event.currentTarget.value)}
                  required
                />
              </label>
            </div>
            <button type="submit">Tagesplan vorschlagen</button>
          </form>
        ) : null}

        {activeView === "week" ? (
          <form
            id="planning-view-week"
            role="tabpanel"
            aria-labelledby="planning-tab-week"
            onSubmit={(event) => {
              event.preventDefault();
              void generateWeekPlan();
            }}
          >
            <h3>Wochenplanung</h3>
            <label>
              <span>Wochenbeginn</span>
              <input
                type="date"
                value={weekStart}
                onChange={(event) => setWeekStart(event.currentTarget.value)}
                required
              />
            </label>
            <label>
              <span>Täglicher Start</span>
              <input
                type="time"
                value={weekStartTime}
                onChange={(event) => setWeekStartTime(event.currentTarget.value)}
                required
              />
            </label>
            <div className={styles.inlineFields}>
              <label>
                <span>Minuten Mo–Fr</span>
                <input
                  type="number"
                  min="0"
                  max="720"
                  value={weekdayMinutes}
                  onChange={(event) => setWeekdayMinutes(event.currentTarget.value)}
                  required
                />
              </label>
              <label>
                <span>Minuten Sa/So</span>
                <input
                  type="number"
                  min="0"
                  max="720"
                  value={weekendMinutes}
                  onChange={(event) => setWeekendMinutes(event.currentTarget.value)}
                  required
                />
              </label>
            </div>
            <button type="submit">Woche vorschlagen</button>
          </form>
        ) : null}

        {activeView === "briefings" ? (
          <form
            id="planning-view-briefings"
            role="tabpanel"
            aria-labelledby="planning-tab-briefings"
            onSubmit={(event) => {
              event.preventDefault();
              const { periodStart, periodEnd } = dayRange(reviewDate);
              void onCreateEveningReview(periodStart, periodEnd);
            }}
          >
            <h3>Abendrückblick</h3>
            <label>
              <span>Tag</span>
              <input
                type="date"
                value={reviewDate}
                onChange={(event) => setReviewDate(event.currentTarget.value)}
                required
              />
            </label>
            <p>Fasst erledigte, teilweise erledigte, ausgelassene und offene Blöcke zusammen.</p>
            <button type="submit">Rückblick erstellen</button>
          </form>
        ) : null}

        {activeView === "feedback" ? (
          <section
            id="planning-view-feedback"
            className={styles.feedbackGuide}
            role="tabpanel"
            aria-labelledby="planning-tab-feedback"
          >
            <h3>Planungsfeedback</h3>
            <p>
              Rückmeldungen werden direkt beim aktuellen Aufgabenblock gespeichert und wirken auf
              den nächsten Vorschlag.
            </p>
          </section>
        ) : null}
      </div>

      <section className={styles.latest} aria-live="polite">
        <h3>Aktueller Vorschlag</h3>
        {latestBriefing ? (
          <article className={styles.briefingCard}>
            <div className={styles.briefingHeader}>
              <div>
                <span>{kindLabels[latestBriefing.kind]}</span>
                <h4>{latestBriefing.title}</h4>
              </div>
              <button type="button" onClick={() => void onTrashBriefing(latestBriefing)}>
                In Papierkorb
              </button>
            </div>
            <p>{latestBriefing.summary}</p>
            <p className={styles.explanation}>{latestBriefing.explanation}</p>
            <dl className={styles.metrics}>
              <div>
                <dt>Verfügbar</dt>
                <dd>{latestBriefing.availableMinutes} Min.</dd>
              </div>
              <div>
                <dt>Geplant</dt>
                <dd>{latestBriefing.plannedMinutes} Min.</dd>
              </div>
              <div>
                <dt>Schutzzeit</dt>
                <dd>{latestBriefing.protectionMinutes} Min.</dd>
              </div>
            </dl>
            {latestBlocks.length > 0 ? (
              <div className={styles.blockList}>
                {latestBlocks.map((block) => (
                  <article key={block.id} className={styles.blockCard} data-kind={block.kind}>
                    <div>
                      <span>
                        {block.kind === "protection" ? "Schutzzeit" : "Aufgabe"} ·{" "}
                        {blockStatusLabels[block.status]}
                      </span>
                      <h5>{block.title}</h5>
                      <p>
                        {formatDateTime(block.startAt)} – {formatDateTime(block.endAt)}
                      </p>
                      <p>{block.explanation}</p>
                      {snapshot.feedback
                        .filter((entry) => entry.workBlockId === block.id)
                        .toSorted((left, right) => right.recordedAt.localeCompare(left.recordedAt))
                        .slice(0, 1)
                        .map((entry) => (
                          <p className={styles.feedbackState} key={entry.id}>
                            Letzte Rückmeldung: {resultLabels[entry.result]} ·{" "}
                            {reasonLabels[entry.reason]}
                            {entry.actualMinutes === null
                              ? ""
                              : ` · ${entry.actualMinutes} tatsächliche Minuten`}
                          </p>
                        ))}
                    </div>
                    <FeedbackForm block={block} onSubmit={onRecordFeedback} />
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>Dieses Briefing enthält keine neuen Arbeitsblöcke.</p>
            )}
          </article>
        ) : (
          <p className={styles.empty}>Noch kein Tages- oder Wochenvorschlag vorhanden.</p>
        )}
      </section>

      {activeView === "briefings" ? (
        <details className={styles.history}>
          <summary>Briefing-Verlauf ({briefings.length})</summary>
          <ul>
            {briefings.map((briefing) => (
              <li key={briefing.id}>
                <strong>{kindLabels[briefing.kind]}</strong>
                <span>{formatDateTime(briefing.generatedAt)}</span>
                <span>{briefing.summary}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {activeView === "feedback" ? (
        <details className={styles.history}>
          <summary>Papierkorb ({snapshot.trash.briefings.length})</summary>
          <ul>
            {snapshot.trash.briefings.map((briefing) => (
              <li key={briefing.id}>
                <strong>{briefing.title}</strong>
                <button type="button" onClick={() => void onRestoreBriefing(briefing)}>
                  Wiederherstellen
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
