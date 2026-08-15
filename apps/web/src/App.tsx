import { RHIA_STAGE } from "@rhia/domain";
import { RHIA_SECURITY_POLICY } from "@rhia/security";
import { useEffect, useState } from "react";
import styles from "./App.module.css";
import type { RhiaCapabilityName } from "./application/rhiaStartStatus";
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
import { useRhiaStartStatus } from "./components/RhiaStartStatusContext";
import { StageOneDataPanel } from "./components/StageOneDataPanel";

type ModuleId = RhiaVoiceTarget;

const modules = [
  {
    id: "overview",
    label: "Übersicht",
    eyebrow: "Firmen-Cockpit",
    capability: "companyCockpit",
  },
  {
    id: "memory",
    label: "Gedächtnis",
    eyebrow: "Bestätigtes Wissen",
    capability: "memory",
  },
  { id: "tasks", label: "Aufgaben", eyebrow: "Arbeitszentrale", capability: "tasks" },
  {
    id: "planning",
    label: "Planung",
    eyebrow: "Tages- und Wochenvorschläge",
    capability: "planning",
  },
  {
    id: "data",
    label: "Daten & Sicherung",
    eyebrow: "Lokale Kontrolle",
    capability: "dataBackup",
  },
] as const satisfies ReadonlyArray<{
  id: ModuleId;
  label: string;
  eyebrow: string;
  capability: RhiaCapabilityName;
}>;

const neuralPaths = [
  "M400 400 C334 332 258 342 190 252 C132 176 94 196 58 118",
  "M400 400 C452 315 526 294 574 206 C608 143 678 146 732 76",
  "M400 400 C465 455 520 462 584 532 C644 596 686 590 760 650",
  "M400 400 C337 472 265 476 214 548 C170 610 104 620 52 706",
  "M400 400 C376 296 400 242 350 158 C315 98 326 70 300 30",
  "M400 400 C488 370 546 388 636 346 C694 318 726 330 786 294",
  "M400 400 C414 496 386 552 430 642 C456 695 438 736 468 790",
  "M400 400 C306 407 250 378 160 414 C102 438 72 422 16 454",
  "M400 400 C348 352 316 285 236 294 C170 302 148 254 88 250",
  "M400 400 C444 338 502 346 534 274 C559 218 606 212 638 166",
  "M400 400 C477 422 501 490 580 490 C644 490 670 536 726 546",
  "M400 400 C358 456 304 446 268 516 C238 574 188 566 148 616",
  "M400 400 C390 326 438 284 414 212 C394 154 430 112 422 56",
  "M400 400 C470 391 506 430 572 404 C628 382 670 410 724 392",
  "M400 400 C407 472 370 516 394 588 C412 644 380 684 392 744",
  "M400 400 C326 386 286 420 218 392 C160 368 116 394 62 372",
  "M400 400 C302 330 246 224 152 238 C90 246 64 208 18 192",
  "M400 400 C488 286 594 266 652 164 C686 104 728 102 794 50",
  "M400 400 C514 486 594 526 654 626 C688 682 724 714 792 750",
  "M400 400 C292 502 210 530 144 636 C108 694 70 730 10 774",
  "M400 400 C346 376 328 326 278 326 C226 326 204 286 164 282",
  "M400 400 C428 344 474 330 492 278 C512 224 548 204 574 168",
  "M400 400 C456 434 468 482 522 500 C572 516 594 558 628 588",
  "M400 400 C362 438 318 448 298 496 C278 544 238 558 204 588",
  "M400 400 C382 356 402 320 380 278 C360 240 376 202 364 166",
  "M400 400 C446 384 480 404 522 382 C562 362 596 378 636 362",
  "M400 400 C418 446 398 480 420 526 C438 564 426 604 442 642",
  "M400 400 C354 414 320 394 276 414 C236 432 200 416 160 434",
] as const;

const neuralLoops = [
  "M166 358 C196 172 354 102 516 160 C684 220 720 408 634 548 C548 686 350 720 208 622 C86 538 72 390 166 358 Z",
  "M236 286 C324 198 474 208 568 298 C660 386 620 542 508 604 C390 670 238 610 186 492 C154 418 174 348 236 286 Z",
  "M294 340 C354 276 458 274 520 338 C586 406 548 508 470 548 C382 594 278 544 252 454 C236 406 250 374 294 340 Z",
  "M112 448 C206 404 242 232 408 222 C566 212 612 346 706 398",
  "M104 284 C228 316 270 170 420 190 C560 208 570 324 708 300",
  "M132 566 C244 510 288 644 430 616 C566 590 574 470 710 506",
] as const;

const neuralNodes = [
  [400, 400, 8],
  [334, 332, 3],
  [258, 342, 2.5],
  [190, 252, 3],
  [94, 196, 2],
  [452, 315, 2.5],
  [526, 294, 3],
  [574, 206, 2],
  [678, 146, 2.5],
  [465, 455, 3],
  [520, 462, 2],
  [584, 532, 3],
  [686, 590, 2.5],
  [337, 472, 2.5],
  [265, 476, 3],
  [214, 548, 2],
  [104, 620, 2.5],
  [376, 296, 2],
  [350, 158, 2.5],
  [488, 370, 2.5],
  [636, 346, 3],
  [414, 496, 2.5],
  [430, 642, 2],
  [306, 407, 2.5],
  [160, 414, 3],
  [236, 294, 2],
  [534, 274, 2.5],
  [580, 490, 3],
  [268, 516, 2.5],
  [414, 212, 2],
  [572, 404, 2.5],
  [394, 588, 2.5],
  [218, 392, 2],
  [152, 238, 2.5],
  [652, 164, 2.5],
  [654, 626, 2],
  [144, 636, 2.5],
] as const;

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
  const startStatus = useRhiaStartStatus();
  const availableModules = modules.filter(
    (module) => startStatus.capabilities[module.capability] === "allowed",
  );
  const voiceAllowed = startStatus.capabilities.oneShotBrowserSpeech === "allowed";
  const [activeModule, setActiveModule] = useState<ModuleId>("overview");
  const [voiceTaskDraft, setVoiceTaskDraft] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState(
    voiceAllowed ? "Mikrofontaste – bereit" : "Mikrofontaste – gesperrt",
  );
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceConsentOpen, setVoiceConsentOpen] = useState(false);
  const [greetingOpen, setGreetingOpen] = useState(() => isRhProduktionAnniversary());
  const [greetingError, setGreetingError] = useState<string | null>(null);
  const activeModuleDetails =
    availableModules.find((module) => module.id === activeModule) ?? modules[0];

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
    if (!voiceAllowed) {
      setVoiceStatus("Mikrofontaste ist laut Startstatus gesperrt.");
      return;
    }
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
        if (command.target && availableModules.some((module) => module.id === command.target)) {
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
    <main
      className={styles.page}
      data-rhia-start-status="loaded"
      data-rhia-role={startStatus.identity.role}
      data-rhia-mode={startStatus.runtime.mode}
    >
      <div className={styles.ambient} aria-hidden="true" />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <span />
          </span>
          <span>RHIA 2.0</span>
        </div>
        <div className={styles.topActions}>
          <span
            className={styles.readyBadge}
            title={`${startStatus.identity.roleLabel} · ${startStatus.runtime.modeLabel}`}
          >
            <span className={styles.readyDot} aria-hidden="true" />
            Startstatus geladen
          </span>
          <span className={styles.settingsGlyph} title="Einstellungen noch nicht aktiv">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z" />
              <path d="m19.2 13.5 1.2 1-.9 2.1-1.6-.1a7.8 7.8 0 0 1-1.4 1.4l.1 1.6-2.1.9-1-1.2a7.3 7.3 0 0 1-2 0l-1 1.2-2.1-.9.1-1.6a7.8 7.8 0 0 1-1.4-1.4l-1.6.1-.9-2.1 1.2-1a7.3 7.3 0 0 1 0-2l-1.2-1 .9-2.1 1.6.1a7.8 7.8 0 0 1 1.4-1.4l-.1-1.6 2.1-.9 1 1.2a7.3 7.3 0 0 1 2 0l1-1.2 2.1.9-.1 1.6a7.8 7.8 0 0 1 1.4 1.4l1.6-.1.9 2.1-1.2 1a7.3 7.3 0 0 1 0 2Z" />
            </svg>
          </span>
          <span className={styles.userBadge}>
            <span aria-hidden="true">{startStatus.identity.ownerSalutation.slice(0, 1)}</span>
            {startStatus.identity.ownerSalutation}
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
                <dt>Start</dt>
                <dd>geladen</dd>
              </div>
              <div>
                <dt>Modus</dt>
                <dd>{startStatus.runtime.modeLabel}</dd>
              </div>
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
            <p className={styles.salutation}>Ja, {startStatus.identity.ownerSalutation}?</p>
          </div>

          <div className={styles.organism} aria-hidden="true">
            <div className={styles.orbitOuter} />
            <div className={styles.orbitInner} />
            <div className={styles.particleField} />
            <svg className={styles.neuralWeb} viewBox="0 0 800 800" aria-hidden="true">
              <defs>
                <radialGradient id="neural-gradient" cx="50%" cy="50%" r="58%">
                  <stop offset="0%" stopColor="#fff1f7" />
                  <stop offset="8%" stopColor="#ff65a0" />
                  <stop offset="48%" stopColor="#e91f69" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#8f0b3d" stopOpacity="0" />
                </radialGradient>
                <filter id="neural-glow" x="-35%" y="-35%" width="170%" height="170%">
                  <feGaussianBlur stdDeviation="2.8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g className={styles.neuralLoops}>
                {neuralLoops.map((path) => (
                  <path key={path} d={path} />
                ))}
              </g>
              <g className={styles.neuralFilaments}>
                {neuralPaths.map((path) => (
                  <path key={path} d={path} />
                ))}
              </g>
              <g className={styles.neuralNodes}>
                {neuralNodes.map(([cx, cy, radius]) => (
                  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={radius} />
                ))}
              </g>
            </svg>
            <div className={styles.core} />
            <div className={styles.highlight} />
          </div>

          <button
            type="button"
            className={styles.composer}
            data-listening={voiceListening || undefined}
            disabled={voiceListening || !voiceAllowed}
            onClick={() => {
              if (voiceAllowed) {
                setVoiceConsentOpen(true);
              }
            }}
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
        {availableModules.map((module) => (
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
