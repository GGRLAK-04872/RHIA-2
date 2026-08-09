import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { ImportPreview } from "@rhia/storage-browser";
import {
  DELETE_ALL_CONFIRMATION,
  localDataService,
  type LocalDataSnapshot,
} from "../application/localDataService";
import styles from "./StageOneDataPanel.module.css";

type LoadState = "loading" | "ready" | "error";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unbekannter Fehler im lokalen Speicher.";
}

export function StageOneDataPanel() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [snapshot, setSnapshot] = useState<LocalDataSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<ImportPreview | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void localDataService
      .initialize()
      .then((nextSnapshot) => {
        if (active) {
          setSnapshot(nextSnapshot);
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
  }, []);

  async function run(operation: () => Promise<LocalDataSnapshot>) {
    setError(null);
    try {
      setSnapshot(await operation());
      return true;
    } catch (reason) {
      setError(errorMessage(reason));
      return false;
    }
  }

  async function handleCreateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    await run(() =>
      localDataService.createNote({
        areaName: String(values.get("areaName") ?? ""),
        title: String(values.get("title") ?? ""),
        body: String(values.get("body") ?? ""),
      }),
    );
    form.reset();
  }

  async function handleUpdateNote(
    event: FormEvent<HTMLFormElement>,
    noteId: string,
    revision: number,
  ) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const updated = await run(() =>
      localDataService.updateNote(noteId, revision, {
        title: String(values.get("title") ?? ""),
        body: String(values.get("body") ?? ""),
      }),
    );
    if (updated) setEditingNoteId(null);
  }

  async function handleExport() {
    setError(null);
    try {
      const backup = await localDataService.createBackupDownload();
      const url = URL.createObjectURL(new Blob([backup.content], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = backup.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function handleImportFile(file: File | undefined) {
    setPendingImport(null);
    if (!file) return;

    setError(null);
    try {
      setPendingImport(await localDataService.previewImport(await file.text()));
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="local-data-title">
      <header className={styles.header}>
        <div>
          <p className={styles.overline}>Lokaler Speicher</p>
          <h2 id="local-data-title">Notizen testen</h2>
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

      {snapshot && (
        <p className={styles.counts}>
          {snapshot.activeNotes.length} aktiv · {snapshot.deletedNotes.length} im Papierkorb ·{" "}
          {snapshot.counts.auditEntries} Prüfvermerke
        </p>
      )}

      <form className={styles.form} onSubmit={handleCreateNote}>
        <label>
          Bereich
          <input name="areaName" required maxLength={120} placeholder="z. B. RHIA" />
        </label>
        <label>
          Titel
          <input name="title" required maxLength={240} placeholder="Kurzer Titel" />
        </label>
        <label>
          Notiz
          <textarea name="body" maxLength={100_000} rows={3} placeholder="Lokale Testnotiz" />
        </label>
        <button type="submit" disabled={loadState !== "ready"}>
          Lokal speichern
        </button>
      </form>

      {snapshot && snapshot.activeNotes.length > 0 && (
        <div className={styles.noteGroup}>
          <h3>Gespeichert</h3>
          <ul className={styles.noteList}>
            {snapshot.activeNotes.map(({ note, areaName }) => (
              <li key={note.id}>
                <div className={styles.noteContent}>
                  <span>{areaName}</span>
                  <strong>{note.title}</strong>
                  {note.body && <p>{note.body}</p>}
                  {editingNoteId === note.id && (
                    <form
                      className={styles.editForm}
                      onSubmit={(event) => handleUpdateNote(event, note.id, note.revision)}
                    >
                      <label>
                        Titel bearbeiten
                        <input name="title" required maxLength={240} defaultValue={note.title} />
                      </label>
                      <label>
                        Notiz bearbeiten
                        <textarea
                          name="body"
                          maxLength={100_000}
                          rows={3}
                          defaultValue={note.body}
                        />
                      </label>
                      <button type="submit">Änderung speichern</button>
                      <button
                        type="button"
                        className={styles.quietButton}
                        onClick={() => setEditingNoteId(null)}
                      >
                        Abbrechen
                      </button>
                    </form>
                  )}
                </div>
                <div className={styles.noteActions}>
                  <button
                    type="button"
                    className={styles.quietButton}
                    onClick={() => setEditingNoteId(note.id)}
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    className={styles.quietButton}
                    onClick={() =>
                      run(() => localDataService.moveNoteToTrash(note.id, note.revision))
                    }
                  >
                    Löschen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {snapshot && snapshot.deletedNotes.length > 0 && (
        <div className={styles.noteGroup}>
          <h3>Papierkorb · 30 Tage</h3>
          <ul className={styles.noteList}>
            {snapshot.deletedNotes.map(({ note, areaName }) => (
              <li key={note.id}>
                <div>
                  <span>{areaName}</span>
                  <strong>{note.title}</strong>
                </div>
                <button
                  type="button"
                  className={styles.quietButton}
                  onClick={() => run(() => localDataService.restoreNote(note.id, note.revision))}
                >
                  Wiederherstellen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className={styles.tools}>
        <summary>Sicherung und Löschung</summary>
        <div className={styles.toolGrid}>
          <button type="button" onClick={handleExport} disabled={loadState !== "ready"}>
            Sicherung exportieren
          </button>
          <label className={styles.fileLabel}>
            Sicherung prüfen
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => handleImportFile(event.currentTarget.files?.[0])}
            />
          </label>
        </div>

        {pendingImport && (
          <div className={styles.importPreview} role="status">
            <p>
              {pendingImport.recordCounts.notes} Notizen · {pendingImport.recordCounts.memoryFacts}{" "}
              Fakten · {pendingImport.recordCounts.decisions} Entscheidungen ·{" "}
              {pendingImport.recordCounts.memoryConflicts} Gedächtniskonflikte ·{" "}
              {pendingImport.conflicts.length} Importkonflikte
            </p>
            <button
              type="button"
              disabled={pendingImport.conflicts.length > 0}
              onClick={() => run(() => localDataService.importBackup(pendingImport))}
            >
              Konfliktfrei importieren
            </button>
          </div>
        )}

        <div className={styles.dangerZone}>
          <label>
            Für Gesamtlöschung exakt eingeben:
            <code>{DELETE_ALL_CONFIRMATION}</code>
            <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          <button
            type="button"
            disabled={confirmation !== DELETE_ALL_CONFIRMATION}
            onClick={() =>
              run(async () => {
                const next = await localDataService.clearAllData(confirmation);
                setConfirmation("");
                return next;
              })
            }
          >
            Alle lokalen Daten löschen
          </button>
        </div>
      </details>
    </section>
  );
}
