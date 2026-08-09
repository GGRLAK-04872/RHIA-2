import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { Decision, MemoryFact } from "@rhia/domain";
import {
  localMemoryService,
  type LocalMemoryService,
  type MemorySearchFilters,
  type MemoryWorkspace,
} from "../application/localMemoryService";
import styles from "./MemoryPanel.module.css";

type LoadState = "loading" | "ready" | "error";
type EntryType = "fact" | "decision";

const originDeviceId = "rhia-local-browser";
const confirmation = { actor: "sir", explicitlyConfirmed: true } as const;
const rejection = { actor: "sir", explicitlyRejected: true } as const;
const discard = { actor: "sir", explicitlyDiscarded: true } as const;
const restore = { actor: "sir", explicitlyRestored: true } as const;
const conflictResolution = { actor: "sir", explicitlyResolved: true } as const;

const statusLabels: Record<string, string> = {
  proposed: "Vorschlag",
  confirmed: "Bestätigt",
  disputed: "Strittig",
  superseded: "Frühere Fassung",
  revoked: "Widerrufen",
  deleted: "Papierkorb",
};

const validityLabels = {
  current: "Aktuell",
  future: "Zukünftig",
  expired: "Abgelaufen",
} as const;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unbekannter Fehler im lokalen Gedächtnis.";
}

export interface MemoryPanelProps {
  service?: LocalMemoryService;
}

export function MemoryPanel({ service = localMemoryService }: MemoryPanelProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [workspace, setWorkspace] = useState<MemoryWorkspace | null>(null);
  const [filters, setFilters] = useState<MemorySearchFilters>({ includeDeleted: true });
  const [entryType, setEntryType] = useState<EntryType>("fact");
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void service
      .getMemoryWorkspace({ includeDeleted: true })
      .then((next) => {
        if (active) {
          setWorkspace(next);
          setLoadState("ready");
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(errorMessage(reason));
          setLoadState("error");
        }
      });
    return () => {
      active = false;
    };
  }, [service]);

  async function refresh(nextFilters = filters) {
    setWorkspace(await service.getMemoryWorkspace(nextFilters));
  }

  async function run(operation: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await operation();
      await refresh();
      return true;
    } catch (reason) {
      setError(errorMessage(reason));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const areaId = String(values.get("areaId") ?? "");
    const sourceIds = [String(values.get("sourceId") ?? "")];
    const completed = await run(() =>
      entryType === "fact"
        ? service.proposeMemoryFact(
            {
              areaId,
              sourceIds,
              knowledgeType: String(values.get("knowledgeType") ?? "profile"),
              subject: String(values.get("subject") ?? "sir"),
              predicate: String(values.get("predicate") ?? "fact"),
              value: String(values.get("value") ?? ""),
              conflictKey: String(values.get("conflictKey") ?? ""),
              displayText: String(values.get("displayText") ?? ""),
            },
            { originDeviceId },
          )
        : service.proposeDecision(
            {
              areaId,
              sourceIds,
              title: String(values.get("title") ?? ""),
              decisionText: String(values.get("decisionText") ?? ""),
              rationale: String(values.get("rationale") ?? ""),
            },
            { originDeviceId },
          ),
    );
    if (completed) form.reset();
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const recordType = String(values.get("recordType") ?? "");
    const status = String(values.get("status") ?? "");
    const areaId = String(values.get("filterAreaId") ?? "");
    const sourceId = String(values.get("filterSourceId") ?? "");
    const validity = String(values.get("validity") ?? "");
    const nextFilters: MemorySearchFilters = {
      includeDeleted: true,
      query: String(values.get("query") ?? ""),
      ...(recordType ? { recordTypes: [recordType as EntryType] } : {}),
      ...(status ? { statuses: [status as MemoryFact["status"]] } : {}),
      ...(areaId ? { areaId } : {}),
      ...(sourceId ? { sourceIds: [sourceId] } : {}),
      ...(validity ? { validity: validity as "current" | "future" | "expired" } : {}),
    };
    setBusy(true);
    setError(null);
    try {
      setFilters(nextFilters);
      await refresh(nextFilters);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function confirmRecord(record: MemoryFact | Decision) {
    await run(() =>
      record.type === "memory-fact"
        ? service.confirmMemoryFact(record.id, record.revision, confirmation)
        : service.confirmDecision(record.id, record.revision, confirmation),
    );
  }

  async function rejectRecord(record: MemoryFact | Decision) {
    await run(() =>
      record.type === "memory-fact"
        ? service.rejectMemoryFact(record.id, record.revision, rejection)
        : service.rejectDecision(record.id, record.revision, rejection),
    );
  }

  async function discardRecord(record: MemoryFact | Decision) {
    await run(() =>
      record.type === "memory-fact"
        ? service.discardMemoryFact(record.id, record.revision, discard)
        : service.discardDecision(record.id, record.revision, discard),
    );
  }

  async function restoreRecord(record: MemoryFact | Decision) {
    await run(() =>
      record.type === "memory-fact"
        ? service.restoreMemoryFact(record.id, record.revision, restore)
        : service.restoreDecision(record.id, record.revision, restore),
    );
  }

  async function handleCorrection(event: FormEvent<HTMLFormElement>, fact: MemoryFact) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const completed = await run(() =>
      service.correctMemoryFact(
        fact.id,
        fact.revision,
        {
          areaId: fact.areaId,
          sourceIds: fact.sourceIds,
          knowledgeType: fact.knowledgeType,
          subject: fact.subject,
          predicate: fact.predicate,
          value: String(values.get("correctedValue") ?? ""),
          conflictKey: fact.conflictKey,
          displayText: String(values.get("correctedDisplayText") ?? ""),
          validFrom: fact.validFrom,
          validUntil: fact.validUntil,
        },
        { originDeviceId },
      ),
    );
    if (completed) setEditingFactId(null);
  }

  return (
    <section className={styles.panel} aria-labelledby="memory-title">
      <header className={styles.header}>
        <div>
          <p className={styles.overline}>Lokales Gedächtnis</p>
          <h2 id="memory-title">Fakten und Entscheidungen</h2>
        </div>
        <span className={styles.storageState} data-state={loadState}>
          {loadState === "loading" && "Wird geöffnet"}
          {loadState === "ready" && "Bereit"}
          {loadState === "error" && "Fehler"}
        </span>
      </header>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {workspace && (
        <>
          <p className={styles.summary}>
            {workspace.hits.length} Treffer · {workspace.openConflicts.length} offene Konflikte
          </p>

          <form className={styles.entryForm} onSubmit={handleCreate}>
            <div className={styles.formRow}>
              <label>
                Eintragstyp
                <select
                  name="entryType"
                  value={entryType}
                  onChange={(event) => setEntryType(event.target.value as EntryType)}
                >
                  <option value="fact">Fakt</option>
                  <option value="decision">Entscheidung</option>
                </select>
              </label>
              <label>
                Bereich
                <select name="areaId" required>
                  {workspace.areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quelle
                <select name="sourceId" required>
                  {workspace.sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {entryType === "fact" ? (
              <div key="fact" className={styles.formGrid}>
                <label>
                  Wissensart
                  <input name="knowledgeType" required defaultValue="profile" maxLength={80} />
                </label>
                <label>
                  Subjekt
                  <input name="subject" required defaultValue="sir" maxLength={240} />
                </label>
                <label>
                  Eigenschaft
                  <input name="predicate" required placeholder="z. B. preferred-address" />
                </label>
                <label>
                  Konfliktschlüssel
                  <input name="conflictKey" required placeholder="sir.profile.preferred-address" />
                </label>
                <label className={styles.wideField}>
                  Wert
                  <textarea name="value" required rows={2} />
                </label>
                <label className={styles.wideField}>
                  Verständliche Anzeige
                  <textarea name="displayText" required rows={2} />
                </label>
              </div>
            ) : (
              <div key="decision" className={styles.formGrid}>
                <label className={styles.wideField}>
                  Entscheidungstitel
                  <input name="title" required maxLength={240} />
                </label>
                <label className={styles.wideField}>
                  Entscheidung
                  <textarea name="decisionText" required rows={2} />
                </label>
                <label className={styles.wideField}>
                  Begründung
                  <textarea name="rationale" required rows={2} />
                </label>
              </div>
            )}
            <button type="submit" disabled={busy}>
              Als Vorschlag speichern
            </button>
          </form>

          <form className={styles.searchForm} onSubmit={handleSearch}>
            <label className={styles.searchField}>
              Gedächtnis durchsuchen
              <input name="query" type="search" placeholder="Suchbegriffe" />
            </label>
            <label>
              Typ
              <select name="recordType">
                <option value="">Alle</option>
                <option value="fact">Fakten</option>
                <option value="decision">Entscheidungen</option>
              </select>
            </label>
            <label>
              Status
              <select name="status">
                <option value="">Alle</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bereich
              <select name="filterAreaId">
                <option value="">Alle</option>
                {workspace.areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quelle
              <select name="filterSourceId">
                <option value="">Alle</option>
                {workspace.sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Aktualität
              <select name="validity">
                <option value="">Alle</option>
                <option value="current">Aktuell</option>
                <option value="future">Zukünftig</option>
                <option value="expired">Abgelaufen</option>
              </select>
            </label>
            <button type="submit" disabled={busy}>
              Filter anwenden
            </button>
          </form>

          {workspace.openConflicts.length > 0 && (
            <div className={styles.conflictGroup}>
              <h3>Offene Konflikte</h3>
              {workspace.openConflicts.map((conflict) => (
                <article key={conflict.id} className={styles.conflictCard}>
                  <strong>{conflict.conflictKey}</strong>
                  <p>RHIA überschreibt keinen Wert. Wähle bewusst, was gelten soll.</p>
                  <div className={styles.actions}>
                    {conflict.factIds.map((factId) => {
                      const fact = workspace.conflictFacts.find(
                        (candidate) => candidate.id === factId,
                      );
                      return fact ? (
                        <button
                          key={fact.id}
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              service.resolveMemoryConflictKeepingFact(
                                conflict.id,
                                conflict.revision,
                                fact.id,
                                conflictResolution,
                              ),
                            )
                          }
                        >
                          Beibehalten: {fact.displayText}
                        </button>
                      ) : null;
                    })}
                    <button
                      type="button"
                      className={styles.quietButton}
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          service.dismissMemoryConflict(
                            conflict.id,
                            conflict.revision,
                            conflictResolution,
                          ),
                        )
                      }
                    >
                      Als Nicht-Konflikt verwerfen
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className={styles.results} aria-live="polite">
            <h3>Gedächtniseinträge</h3>
            {workspace.hits.length === 0 ? (
              <p className={styles.empty}>Keine passenden Einträge.</p>
            ) : (
              <ul className={styles.memoryList}>
                {workspace.hits.map((hit) => {
                  const record = hit.record;
                  const title = record.type === "memory-fact" ? record.displayText : record.title;
                  const detail = record.type === "memory-fact" ? record.value : record.decisionText;
                  return (
                    <li key={record.id} data-status={record.status}>
                      <div className={styles.recordHeader}>
                        <div>
                          <span className={styles.meta}>
                            {hit.recordType === "fact" ? "Fakt" : "Entscheidung"} · {hit.areaName} ·{" "}
                            {hit.sources.map((source) => source.label).join(", ")}
                          </span>
                          <strong>{title}</strong>
                        </div>
                        <div className={styles.badges}>
                          <span>{statusLabels[record.status] ?? record.status}</span>
                          <span>{validityLabels[hit.validity]}</span>
                        </div>
                      </div>
                      <p>{detail}</p>
                      {record.supersedesId && (
                        <small>Diese Fassung korrigiert einen früheren Eintrag.</small>
                      )}

                      {record.type === "memory-fact" && editingFactId === record.id && (
                        <form
                          className={styles.correctionForm}
                          onSubmit={(event) => handleCorrection(event, record)}
                        >
                          <label>
                            Korrigierter Wert
                            <textarea name="correctedValue" required defaultValue={record.value} />
                          </label>
                          <label>
                            Korrigierte Anzeige
                            <textarea
                              name="correctedDisplayText"
                              required
                              defaultValue={record.displayText}
                            />
                          </label>
                          <button type="submit" disabled={busy}>
                            Korrektur vorschlagen
                          </button>
                          <button
                            type="button"
                            className={styles.quietButton}
                            onClick={() => setEditingFactId(null)}
                          >
                            Abbrechen
                          </button>
                        </form>
                      )}

                      <div className={styles.actions}>
                        {record.status === "proposed" && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => confirmRecord(record)}
                            >
                              Bestätigen
                            </button>
                            <button
                              type="button"
                              className={styles.quietButton}
                              disabled={busy}
                              onClick={() => rejectRecord(record)}
                            >
                              Ablehnen
                            </button>
                          </>
                        )}
                        {record.status === "confirmed" && (
                          <>
                            {record.type === "memory-fact" && (
                              <button
                                type="button"
                                className={styles.quietButton}
                                onClick={() => setEditingFactId(record.id)}
                              >
                                Korrigieren
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.dangerButton}
                              disabled={busy}
                              onClick={() => discardRecord(record)}
                            >
                              Verwerfen
                            </button>
                          </>
                        )}
                        {record.status === "deleted" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => restoreRecord(record)}
                          >
                            Als Vorschlag wiederherstellen
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
