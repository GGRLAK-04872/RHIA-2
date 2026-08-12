export type RhiaVoiceTarget = "overview" | "memory" | "tasks" | "planning" | "data";

export interface RhiaVoiceCommand {
  target: RhiaVoiceTarget | null;
  taskDraft: string | null;
  reply: string;
}

interface BrowserSpeechRecognitionAlternative {
  transcript: string;
}

interface BrowserSpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: BrowserSpeechRecognitionAlternative;
}

interface BrowserSpeechRecognitionResultList {
  readonly length: number;
  [index: number]: BrowserSpeechRecognitionResult;
}

interface BrowserSpeechRecognitionEvent extends Event {
  readonly results: BrowserSpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

type SpeechWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

export interface BrowserSpeechSession {
  stop(): void;
}

export interface BrowserSpeechCallbacks {
  onResult(transcript: string): void;
  onError(message: string): void;
  onEnd(): void;
}

function normalizeVoiceText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-DE")
    .replace(/[^a-z0-9äöüß\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRhiaVoiceCommand(transcript: string): RhiaVoiceCommand {
  const normalized = normalizeVoiceText(transcript);
  const taskMatch = transcript.trim().match(/(?:neue|neuen)\s+aufgabe\s+(.+)/i);

  if (taskMatch?.[1]) {
    const taskDraft = taskMatch[1].trim();
    return {
      target: "overview",
      taskDraft,
      reply: `Ich habe die Aufgabe ${taskDraft} in die Schnelleingabe übernommen. Bitte prüfen und bestätigen.`,
    };
  }
  if (normalized.includes("gedachtnis") || normalized.includes("wissen")) {
    return { target: "memory", taskDraft: null, reply: "Ich öffne das Gedächtnis, Sir." };
  }
  if (
    normalized.includes("planung") ||
    normalized.includes("tagesplan") ||
    normalized.includes("wochenplan") ||
    normalized === "woche"
  ) {
    return { target: "planning", taskDraft: null, reply: "Ich öffne die Planung, Sir." };
  }
  if (normalized.includes("sicherung") || normalized.includes("daten")) {
    return { target: "data", taskDraft: null, reply: "Ich öffne Daten und Sicherung, Sir." };
  }
  if (normalized.includes("aufgabe") || normalized.includes("projekt")) {
    return { target: "tasks", taskDraft: null, reply: "Ich öffne die Arbeitszentrale, Sir." };
  }
  if (
    normalized.includes("ubersicht") ||
    normalized.includes("cockpit") ||
    normalized.includes("heute") ||
    normalized.includes("was ist wichtig") ||
    normalized.includes("was soll ich")
  ) {
    return { target: "overview", taskDraft: null, reply: "Ich zeige das Firmen-Cockpit, Sir." };
  }

  return {
    target: null,
    taskDraft: null,
    reply:
      "Das habe ich noch nicht sicher verstanden. Sagen Sie zum Beispiel: Zeige Übersicht oder Neue Aufgabe Angebot vorbereiten.",
  };
}

export function browserSpeechRecognitionAvailable(targetWindow: Window = window): boolean {
  const speechWindow = targetWindow as SpeechWindow;
  return Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition);
}

export function startBrowserSpeechRecognition(
  callbacks: BrowserSpeechCallbacks,
  targetWindow: Window = window,
): BrowserSpeechSession | null {
  const speechWindow = targetWindow as SpeechWindow;
  const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  if (!Recognition) {
    return null;
  }

  const recognition = new Recognition();
  recognition.lang = "de-DE";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript?.trim();
    if (transcript) {
      callbacks.onResult(transcript);
    } else {
      callbacks.onError("RHIA hat keine verständliche Sprache erkannt.");
    }
  };
  recognition.onerror = (event) => {
    const messages: Record<string, string> = {
      "not-allowed": "Mikrofonzugriff wurde nicht erlaubt.",
      "audio-capture": "Das Mikrofon ist auf diesem Gerät nicht verfügbar.",
      network: "Die Browser-Spracherkennung ist derzeit nicht erreichbar.",
      "no-speech": "Es wurde keine Sprache erkannt.",
    };
    callbacks.onError(messages[event.error] ?? `Spracherkennung fehlgeschlagen: ${event.error}`);
  };
  recognition.onend = callbacks.onEnd;
  try {
    recognition.start();
  } catch (reason) {
    callbacks.onError(
      reason instanceof Error
        ? `Spracherkennung konnte nicht gestartet werden: ${reason.message}`
        : "Spracherkennung konnte nicht gestartet werden.",
    );
    callbacks.onEnd();
    return null;
  }

  return {
    stop: () => recognition.stop(),
  };
}

export function speakWithBrowserVoice(text: string, targetWindow: Window = window): boolean {
  if (
    !("speechSynthesis" in targetWindow) ||
    typeof globalThis.SpeechSynthesisUtterance !== "function"
  ) {
    return false;
  }
  const utterance = new globalThis.SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.94;
  utterance.pitch = 1;
  targetWindow.speechSynthesis.cancel();
  targetWindow.speechSynthesis.speak(utterance);
  return true;
}
