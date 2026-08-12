import { type AppStatus, appStatusSchema } from "@rhia/contracts";
import { RHIA_PRODUCT_NAME, RHIA_RUNTIME, RHIA_STAGE, RHIA_VERSION } from "@rhia/domain";
import { RHIA_SECURITY_POLICY } from "@rhia/security";
import { useState } from "react";
import styles from "./App.module.css";
import { LocalPlanningPanel } from "./components/LocalPlanningPanel";
import { LocalWorkHubPanel } from "./components/LocalWorkHubPanel";
import { MemoryPanel } from "./components/MemoryPanel";
import { StageOneDataPanel } from "./components/StageOneDataPanel";

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

type ModuleId = "overview" | "memory" | "tasks" | "planning" | "data";

const modules = [
  { id: "overview", label: "Übersicht", eyebrow: "Lokaler Betriebszustand" },
  { id: "memory", label: "Gedächtnis", eyebrow: "Bestätigtes Wissen" },
  { id: "tasks", label: "Aufgaben", eyebrow: "Arbeitszentrale" },
  { id: "planning", label: "Planung", eyebrow: "Tages- und Wochenvorschläge" },
  { id: "data", label: "Daten & Sicherung", eyebrow: "Lokale Kontrolle" },
] as const satisfies ReadonlyArray<{ id: ModuleId; label: string; eyebrow: string }>;

function ModuleIcon({ module }: { module: ModuleId }) {
  if (module === "overview") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 10.4 12 3l8.5 7.4v9.1a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
        <path d="M9 21v-6h6v6" />
      </svg>
    );
  }
  if (module === "memory") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9.4 4.1A4 4 0 0 0 5 8v1a3.5 3.5 0 0 0 0 6v1a4 4 0 0 0 4.4 3.9M14.6 4.1A4 4 0 0 1 19 8v1a3.5 3.5 0 0 1 0 6v1a4 4 0 0 1-4.4 3.9M12 3v18M8 9.5h4M12 14.5h4" />
      </svg>
    );
  }
  if (module === "tasks") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4h8M9 2.8h6a1 1 0 0 1 1 1V6H8V3.8a1 1 0 0 1 1-1Z" />
        <path d="M6 5h12a2 2 0 0 1 2 2v13H4V7a2 2 0 0 1 2-2Z" />
        <path d="m8 11 1.5 1.5L12 10M8 16h8" />
      </svg>
    );
  }
  if (module === "planning") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM7 2v4M17 2v4M3 9h18" />
        <path d="M7 13h3M14 13h3M7 17h3M14 17h3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="9" cy="5.5" rx="5.5" ry="2.5" />
      <path d="M3.5 5.5v6c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-6M3.5 11.5v5C3.5 18 6 19 9 19c.7 0 1.4-.1 2-.2" />
      <path d="M16.5 12.5v8M13.5 17.5l3 3 3-3M16.5 20.5h4" />
    </svg>
  );
}

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("overview");
  const activeModuleDetails = modules.find((module) => module.id === activeModule) ?? modules[0];

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <span />
          </span>
          <span>RHIA 2.0</span>
        </div>
        <div className={styles.topActions}>
          <span className={styles.readyBadge}>
            <span className={styles.readyDot} aria-hidden="true" />
            Bereit
          </span>
          <span className={styles.userBadge}>
            <span aria-hidden="true">S</span>
            Sir
          </span>
        </div>
      </header>

      <div className={styles.workspace}>
        <section className={styles.hero} aria-labelledby="rhia-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>RH Produktion · Stufe {RHIA_STAGE}</p>
            <h1 id="rhia-title">{RHIA_PRODUCT_NAME}</h1>
            <p className={styles.salutation}>Ja, Sir?</p>
          </div>

          <div className={styles.organism} aria-hidden="true">
            <div className={styles.orbitOuter} />
            <div className={styles.orbitInner} />
            <div className={styles.particleField} />
            <div className={styles.core} />
            <div className={styles.highlight} />
          </div>

          <div className={styles.heroState}>
            <span>Visuelle Präsenz</span>
            <strong>Lokale Steuerung aktiv</strong>
            <small>Sprache und externe KI bleiben deaktiviert.</small>
          </div>
        </section>

        <section
          className={styles.moduleShell}
          aria-label={`Aktiver Bereich: ${activeModuleDetails.label}`}
        >
          <header className={styles.moduleHeader}>
            <div className={styles.moduleTitle}>
              <span className={styles.moduleIcon}>
                <ModuleIcon module={activeModule} />
              </span>
              <div>
                <p>{activeModuleDetails.eyebrow}</p>
                <h2>{activeModuleDetails.label}</h2>
              </div>
            </div>
            <span className={styles.stageBadge}>Stufe {RHIA_STAGE} · lokal</span>
          </header>

          <div className={styles.moduleViewport}>
            <section
              id="module-overview"
              className={styles.modulePanel}
              role="tabpanel"
              aria-labelledby="nav-overview"
              hidden={activeModule !== "overview"}
            >
              <section className={styles.statusCard} aria-labelledby="system-status-title">
                <div className={styles.statusHeader}>
                  <div>
                    <p className={styles.statusOverline}>Systemstatus</p>
                    <h3 id="system-status-title">Kontrollierter Start</h3>
                  </div>
                  <span className={styles.localState}>Lokal bereit</span>
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

              <section className={styles.orientationCard} aria-labelledby="orientation-title">
                <p className={styles.statusOverline}>Aktueller Schritt</p>
                <h3 id="orientation-title">Planung und Briefings</h3>
                <p>
                  Wissen, Aufgaben, Planungen und Sicherungen bleiben in der lokalen
                  Browserdatenbank. Wählen Sie unten den benötigten Arbeitsbereich.
                </p>
                <div className={styles.versionRow}>
                  <span>Version {status.version}</span>
                  <span>Dexie 5</span>
                  <span>Sicherung 4</span>
                </div>
              </section>
            </section>

            <section
              id="module-memory"
              className={styles.modulePanel}
              role="tabpanel"
              aria-labelledby="nav-memory"
              hidden={activeModule !== "memory"}
            >
              <MemoryPanel />
            </section>

            <section
              id="module-tasks"
              className={`${styles.modulePanel} ${styles.moduleStack}`}
              role="tabpanel"
              aria-labelledby="nav-tasks"
              hidden={activeModule !== "tasks"}
            >
              <LocalWorkHubPanel />
            </section>

            <section
              id="module-planning"
              className={styles.modulePanel}
              role="tabpanel"
              aria-labelledby="nav-planning"
              hidden={activeModule !== "planning"}
            >
              <LocalPlanningPanel />
            </section>

            <section
              id="module-data"
              className={styles.modulePanel}
              role="tabpanel"
              aria-labelledby="nav-data"
              hidden={activeModule !== "data"}
            >
              <StageOneDataPanel />
            </section>
          </div>
        </section>
      </div>

      <div className={styles.bottomNav} aria-label="RHIA Hauptbereiche" role="tablist">
        {modules.map((module) => (
          <button
            key={module.id}
            id={`nav-${module.id}`}
            type="button"
            role="tab"
            aria-selected={activeModule === module.id}
            aria-controls={`module-${module.id}`}
            onClick={() => setActiveModule(module.id)}
          >
            <span className={styles.navIcon}>
              <ModuleIcon module={module.id} />
            </span>
            <span>{module.label}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
