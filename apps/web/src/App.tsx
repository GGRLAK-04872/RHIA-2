import { appStatusSchema, type AppStatus } from "@rhia/contracts";
import { RHIA_PRODUCT_NAME, RHIA_RUNTIME, RHIA_STAGE, RHIA_VERSION } from "@rhia/domain";
import { RHIA_SECURITY_POLICY } from "@rhia/security";
import { MemoryPanel } from "./components/MemoryPanel";
import { StageOneDataPanel } from "./components/StageOneDataPanel";
import styles from "./App.module.css";

const status: AppStatus = appStatusSchema.parse({
  version: RHIA_VERSION,
  stage: RHIA_STAGE,
  mode: "local-first",
  apiEnabled: RHIA_RUNTIME.externalAi,
  persistenceEnabled: RHIA_RUNTIME.persistence,
});

const checks = [
  {
    label: "Betriebsart",
    value: "Local-first",
  },
  {
    label: "OpenAI API",
    value: status.apiEnabled ? "Aktiv" : "Deaktiviert",
  },
  {
    label: "Cloud-Speicher",
    value: RHIA_RUNTIME.cloudRuntime ? "Aktiv" : "Nicht verbunden",
  },
  {
    label: "Datenbank",
    value: status.persistenceEnabled ? "IndexedDB" : "Deaktiviert",
  },
] as const;

export function App() {
  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />

      <section className={styles.hero} aria-labelledby="rhia-title">
        <div className={styles.organism} aria-hidden="true">
          <div className={styles.orbit} />
          <div className={styles.core} />
          <div className={styles.highlight} />
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>RH Produktion · Stufe {RHIA_STAGE}</p>
          <h1 id="rhia-title">{RHIA_PRODUCT_NAME}</h1>
          <p className={styles.lead}>Bestätigtes Wissen bleibt unter deiner Kontrolle.</p>
          <p className={styles.explanation}>
            Fakten, Entscheidungen, Konflikte und Sicherungen bleiben in deiner lokalen
            Browserdatenbank. Cloud-Dienste und kostenpflichtige KI-Aufrufe bleiben deaktiviert.
          </p>
        </div>
      </section>

      <div className={styles.sideColumn}>
        <section className={styles.statusCard} aria-labelledby="system-status-title">
          <div className={styles.statusHeader}>
            <div>
              <p className={styles.statusOverline}>Systemstatus</p>
              <h2 id="system-status-title">Kontrollierter Start</h2>
            </div>
            <span className={styles.readyBadge}>
              <span className={styles.readyDot} aria-hidden="true" />
              Stufe 2 lokal
            </span>
          </div>

          <dl className={styles.statusGrid}>
            {checks.map((check) => (
              <div key={check.label}>
                <dt>{check.label}</dt>
                <dd>{check.value}</dd>
              </div>
            ))}
          </dl>

          <p className={styles.safetyNote} role="status">
            {RHIA_SECURITY_POLICY.cloudFallbackAllowed
              ? "Cloud-Fallback aktiv"
              : "Kein stiller Rückfall auf alte RHIA- oder Cloud-Datenquellen."}
          </p>
        </section>

        <MemoryPanel />
        <StageOneDataPanel />
      </div>

      <footer className={styles.footer}>
        <span>Version {status.version}</span>
        <span aria-hidden="true">·</span>
        <span>Aktueller Schritt: Gedächtnis v1</span>
      </footer>
    </main>
  );
}
