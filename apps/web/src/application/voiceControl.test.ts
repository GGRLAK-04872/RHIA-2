import { describe, expect, it, vi } from "vitest";
import {
  browserSpeechRecognitionAvailable,
  parseRhiaVoiceCommand,
  startBrowserSpeechRecognition,
} from "./voiceControl";

describe("RHIA Browser-Sprachsteuerung", () => {
  it("öffnet die freigegebenen lokalen Bereiche", () => {
    expect(parseRhiaVoiceCommand("Zeige mir die Planung").target).toBe("planning");
    expect(parseRhiaVoiceCommand("Öffne Daten und Sicherung").target).toBe("data");
    expect(parseRhiaVoiceCommand("Was ist heute wichtig?").target).toBe("overview");
  });

  it("übernimmt eine neue Aufgabe nur als zu bestätigenden Entwurf", () => {
    expect(parseRhiaVoiceCommand("Neue Aufgabe Angebot für Kunde vorbereiten")).toMatchObject({
      target: "overview",
      taskDraft: "Angebot für Kunde vorbereiten",
    });
  });

  it("führt unbekannte Sprache nicht als Aktion aus", () => {
    expect(parseRhiaVoiceCommand("Mach einfach alles automatisch")).toMatchObject({
      target: null,
      taskDraft: null,
    });
  });

  it("meldet ehrlich, wenn der Browser keine Spracherkennung anbietet", () => {
    const unsupportedWindow = {} as Window;

    expect(browserSpeechRecognitionAvailable(unsupportedWindow)).toBe(false);
    expect(
      startBrowserSpeechRecognition(
        { onResult: vi.fn(), onError: vi.fn(), onEnd: vi.fn() },
        unsupportedWindow,
      ),
    ).toBeNull();
  });

  it("macht einen vom Browser abgelehnten Start sichtbar", () => {
    class RejectedRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult = null;
      onerror = null;
      onend = null;

      start() {
        throw new Error("Start blockiert");
      }

      stop() {}
    }

    const onError = vi.fn();
    const onEnd = vi.fn();
    const targetWindow = { SpeechRecognition: RejectedRecognition } as unknown as Window;

    expect(
      startBrowserSpeechRecognition({ onResult: vi.fn(), onError, onEnd }, targetWindow),
    ).toBeNull();
    expect(onError).toHaveBeenCalledWith(
      "Spracherkennung konnte nicht gestartet werden: Start blockiert",
    );
    expect(onEnd).toHaveBeenCalledOnce();
  });
});
