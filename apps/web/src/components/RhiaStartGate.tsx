import { type ReactNode, useEffect, useState } from "react";
import {
  loadRhiaStartStatus,
  RhiaStartStatusError,
  type RhiaStartStatus,
} from "../application/rhiaStartStatus";
import styles from "./RhiaStartGate.module.css";
import { RhiaStartStatusProvider } from "./RhiaStartStatusContext";

type StartState =
  | { status: "loading" }
  | { status: "ready"; value: RhiaStartStatus }
  | { status: "error"; message: string };

export function RhiaStartGate({
  children,
  loader = () => loadRhiaStartStatus(),
}: {
  children: ReactNode;
  loader?: (attempt: number) => Promise<RhiaStartStatus>;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<StartState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    void loader(attempt)
      .then((value) => {
        if (active) {
          setState({ status: "ready", value });
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          const message =
            reason instanceof RhiaStartStatusError
              ? reason.message
              : "Die zentrale Startdatei konnte nicht geprüft werden.";
          setState({ status: "error", message });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, loader]);

  if (state.status === "loading") {
    return (
      <main className={styles.page}>
        <section className={styles.card} role="status" aria-live="polite">
          <p className={styles.eyebrow}>RHIA 2.0</p>
          <h1>Startstatus wird geladen …</h1>
          <p>RHIA prüft Rolle, Arbeitsmodus und Freigabegrenzen.</p>
        </section>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className={styles.page}>
        <section className={styles.card} role="alert" aria-labelledby="rhia-start-status-error">
          <p className={styles.eyebrow}>Startprüfung fehlgeschlagen</p>
          <h1 id="rhia-start-status-error">RHIA konnte nicht starten.</h1>
          <p>{state.message} Es wurde kein Ersatz-Startstatus verwendet.</p>
          <button type="button" onClick={() => setAttempt((current) => current + 1)}>
            Startdatei erneut laden
          </button>
        </section>
      </main>
    );
  }

  return <RhiaStartStatusProvider status={state.value}>{children}</RhiaStartStatusProvider>;
}
