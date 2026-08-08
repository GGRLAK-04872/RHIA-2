import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("RHIA_START_ERROR", error.name, info.componentStack ? "component" : "unknown");
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className={styles.page}>
          <section className={styles.card} role="alert" aria-labelledby="rhia-start-error">
            <p className={styles.eyebrow}>RHIA 2.0</p>
            <h1 id="rhia-start-error">RHIA konnte nicht starten.</h1>
            <p>
              Die App hat einen technischen Fehler erkannt und keine Ersatz-Datenquelle verwendet.
            </p>
            <button type="button" onClick={() => window.location.reload()}>
              Neu laden
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
