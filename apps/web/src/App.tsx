import { RHIA_STAGE } from "@rhia/domain";
import { RHIA_SECURITY_POLICY } from "@rhia/security";
import { useEffect, useState } from "react";
import styles from "./App.module.css";
import {
  ensureRhProduktionStartReminder,
  isRhProduktionAnniversary,
  RH_PRODUKTION_START_GREETING,
} from "./application/businessStartService";
import {
  browserSpeechRecognitionAvailable,
  parseRhiaVoiceCommand,
  type RhiaVoiceTarget,
  speakWithBrowserVoice,
  startBrowserSpeechRecognition,
} from "./application/voiceControl";
import { BusinessCockpitPanel } from "./components/BusinessCockpitPanel";
import { LocalPlanningPanel } from "./components/LocalPlanningPanel";
import { LocalWorkHubPanel } from "./components/LocalWorkHubPanel";
import { MemoryPanel } from "./components/MemoryPanel";
import { RhiaPresenceStage } from "./components/RhiaPresenceStage";
import { StageOneDataPanel } from "./components/StageOneDataPanel";

type ModuleId = RhiaVoiceTarget;

const modules = [
  { id: "overview", label: "Übersicht", eyebrow: "Firmen-Cockpit" },
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
  const [voiceTaskDraft, setVoiceTaskDraft] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState("Mikrofontaste – bereit");
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceConsentOpen, setVoiceConsentOpen] = useState(false);
  const [greetingOpen, setGreetingOpen] = useState(() => isRhProduktionAnniversary());
  const [greetingError, setGreetingError] = useState<string | null>(null);
  const activeModuleDetails = modules.find((module) => module.id === activeModule) ?? modules[0];

  useEffect(() => {
    let active = true;
    void ensureRhProduktionStartReminder().catch((reason: unknown) => {
      if (active) {
        setGreetingError(
          reason instanceof Error
            ? reason.message
            : "Die jährliche RH-Produktion-Erinnerung konnte nicht gespeichert werden.",
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const speak = (message: string) => {
    if (!speakWithBrowserVoice(message)) {
      setVoiceStatus("Sprachausgabe wird von diesem Browser nicht unterstützt.");
    }
  };

  const startVoiceControl = () => {
    if (!browserSpeechRecognitionAvailable()) {
      setVoiceStatus("Browser-Spracherkennung ist auf diesem Gerät nicht verfügbar.");
      return;
    }
    setVoiceListening(true);
    setVoiceStatus("RHIA hört jetzt einmalig zu …");
    const session = startBrowserSpeechRecognition({
      onResult: (transcript) => {
        const command = parseRhiaVoiceCommand(transcript);
        setVoiceStatus(`Erkannt: ${transcript}`);
        if (command.target) {
          setActiveModule(command.target);
        }
        if (command.taskDraft) {
          setVoiceTaskDraft(command.taskDraft);
        }
        speak(command.reply);
      },
      onError: (message) => {
        setVoiceStatus(message);
      },
      onEnd: () => {
        setVoiceListening(false);
      },
    });
    if (!session) {
      setVoiceListening(false);
    }
  };

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
          <span className={styles.settingsGlyph} title="Einstellungen noch nicht aktiv">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z" />
              <path d="m19.2 13.5 1.2 1-.9 2.1-1.6-.1a7.8 7.8 0 0 1-1.4 1.4l.1 1.6-2.1.9-1-1.2a7.3 7.3 0 0 1-2 0l-1 1.2-2.1-.9.1-1.6a7.8 7.8 0 0 1-1.4-1.4l-1.6.1-.9-2.1 1.2-1a7.3 7.3 0 0 1 0-2l-1.2-1 .9-2.1 1.6.1a7.8 7.8 0 0 1 1.4-1.4l-.1-1.6 2.1-.9 1 1.2a7.3 7.3 0 0 1 2 0l1-1.2 2.1.9-.1 1.6a7.8 7.8 0 0 1 1.4 1.4l1.6-.1.9 2.1-1.2 1a7.3 7.3 0 0 1 0 2Z" />
            </svg>
          </span>
          <span className={styles.userBadge}>
            <span aria-hidden="true">S</span>
            Sir
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </span>
        </div>
      </header>

      {greetingOpen ? (
        <section className={styles.greetingBackdrop} aria-label="RH-Produktion-Starttag">
          <div
            className={styles.greetingCard}
            role="dialog"
            aria-modal="true"
            aria-label="RH-Produktion-Starttag"
          >
            <p className={styles.greetingOverline}>12. August · jährliche Erinnerung</p>
            <h2>Herzlichen Glückwunsch, Sir.</h2>
            <p>{RH_PRODUKTION_START_GREETING}</p>
            {greetingError ? <p role="alert">{greetingError}</p> : null}
            <div className={styles.greetingActions}>
              <button type="button" onClick={() => speak(RH_PRODUKTION_START_GREETING)}>
                Begrüßung anhören
              </button>
              <button
                type="button"
                onClick={() => {
                  setGreetingOpen(false);
                  setActiveModule("overview");
                }}
              >
                RHIA starten
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {voiceConsentOpen ? (
        <section className={styles.greetingBackdrop} aria-label="Sprachfreigabe">
          <div
            className={styles.greetingCard}
            role="dialog"
            aria-modal="true"
            aria-label="Sprachfreigabe"
          >
            <p className={styles.greetingOverline}>Mikrofon · einmalige Freigabe</p>
            <h2>Soll RHIA jetzt zuhören?</h2>
            <p>
              Das Mikrofon ist nur für diesen einen Sprachbefehl aktiv. RHIA speichert kein Audio.
              Die Spracherkennung wird vom Browser bereitgestellt und kann Sprache an dessen
              Anbieter übertragen.
            </p>
            <div className={styles.greetingActions}>
              <button type="button" onClick={() => setVoiceConsentOpen(false)}>
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoiceConsentOpen(false);
                  startVoiceControl();
                }}
              >
                Einmalig zuhören
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <div className={styles.workspace}>
        <section className={styles.hero} aria-labelledby="rhia-title">
          <aside className={styles.systemRail} aria-label="Lokaler Systemstatus">
            <div className={styles.railHeading}>
              <span>Systemstatus</span>
              <i aria-hidden="true" />
            </div>
            <div className={styles.localRing}>
              <strong>100%</strong>
              <span>lokal</span>
            </div>
            <dl className={styles.railChecks}>
              <div>
                <dt>API</dt>
                <dd>aus</dd>
              </div>
              <div>
                <dt>Cloud</dt>
                <dd>aus</dd>
              </div>
              <div>
                <dt>Schema</dt>
                <dd>5</dd>
              </div>
              <div>
                <dt>Backup</dt>
                <dd>v4</dd>
              </div>
            </dl>
            <div className={styles.railSource}>
              <span>Datenquelle</span>
              <strong>IndexedDB</strong>
            </div>
          </aside>

          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>RH Produktion · Stufe {RHIA_STAGE}</p>
            <h1 id="rhia-title">RHIA</h1>
            <p className={styles.salutation}>Ja, Sir?</p>
          </div>

          <div className={styles.organism} aria-hidden="true">
            <RhiaPresenceStage />
          </div>

          <button
            type="button"
            className={styles.composer}
            data-listening={voiceListening || undefined}
            disabled={voiceListening}
            onClick={() => setVoiceConsentOpen(true)}
            title="Mikrofon ist nur während dieser Spracheingabe aktiv"
          >
            <span className={styles.composerIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7.5A2.5 2.5 0 0 1 9.5 5h5A2.5 2.5 0 0 1 17 7.5v5a2.5 2.5 0 0 1-2.5 2.5H12l-3.5 3v-3A2.5 2.5 0 0 1 6 12.5v-5Z" />
                <circle cx="12" cy="10" r="2.3" />
              </svg>
            </span>
            <span className={styles.composerText}>{voiceStatus}</span>
            <span className={styles.waveform} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <small>Browser-Spracherkennung · RHIA speichert kein Audio</small>
          </button>
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
              <BusinessCockpitPanel
                voiceTaskDraft={voiceTaskDraft}
                onVoiceTaskDraftConsumed={() => setVoiceTaskDraft(null)}
              />
              <p className={styles.safetyNote} role="status">
                {RHIA_SECURITY_POLICY.cloudFallbackAllowed
                  ? "Cloud-Fallback aktiv"
                  : "Kein stiller Rückfall auf alte RHIA- oder Cloud-Datenquellen."}
              </p>
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
