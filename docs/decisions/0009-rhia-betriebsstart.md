# ADR 0009 – RHIA-Betriebsstart vor dem echten Wake-Word

**Status:** von Sir am 12.08.2026 freigegeben; technische und reale Abnahme offen
**Datum:** 12.08.2026
**Ausgangsstand:** `agent/stufe-4-ui-shell` auf
`836cfff045c98aef9563521313c6f0c353b0edc7`

## Entscheidung

RHIA erhält innerhalb der bereits umgesetzten Stufe 4 einen eng begrenzten Betriebsstart:

1. Die Übersicht startet als Firmen-Cockpit und ordnet vorhandene lokale Aufgaben in Fokus,
   Geldwirkung, Blockaden, Entscheidungen und Projekte ein.
2. Der 12. August 2026 wird einmalig als bestätigter Gedächtnisfakt gespeichert und jedes Jahr am
   12. August als RH-Produktionstag angezeigt.
3. Beim Öffnen an diesem Jahrestag begrüßt RHIA Sir sichtbar. Die Sprachausgabe startet erst nach
   einem Klick, damit Browser-Autoplayregeln und Sirs Kontrolle gewahrt bleiben.
4. Die Mikrofontaste startet nach einer sichtbaren Einwilligung genau eine Browser-
   Spracherkennung. Navigationsbefehle werden lokal zugeordnet. Eine gesprochene neue Aufgabe wird
   nur als Entwurf übernommen und benötigt weiterhin Sirs ausdrückliche Bestätigung.

Das echte Wake-Word `Rhia`, Dauerhören, Hintergrundbetrieb, lokale VAD/STT/TTS, Online-Fallback und
native Android-Hülle bleiben in Stufe 9.

## Vollständiger aktiver Softwarestack

| Ebene | Technik | Nutzung im Betriebsstart |
|---|---|---|
| Web/PWA | React 19, Vite 8, TypeScript Strict | Cockpit, Dialoge und Steuerung |
| Domäne | vorhandene Task- und Prioritätsdienste | erklärbare Rangfolge ohne KI |
| Geschäftsdaten | IndexedDB über Dexie 4, Schema 5 | einzige lokale Quelle |
| Erinnerung | vorhandener bestätigter `MemoryFact` | kein neues Schema und kein Fremdkalender |
| Eingabesprache | Browser `SpeechRecognition`/`webkitSpeechRecognition` | genau ein deutscher Befehl nach Einwilligung |
| Ausgabesprache | Browser `speechSynthesis` | Begrüßung und kurze Rückmeldung nach Klick |
| Validierung | vorhandene Zod-Verträge | unveränderte Fach- und Importregeln |
| Sicherung | `rhia-backup` Version 4, SHA-256 | unverändert, Erinnerung wird mitgesichert |
| Prüfung | Biome, TypeScript, Vitest, Testing Library, Playwright | Unit-, Komponenten- und Browsernachweise |
| Veröffentlichung | GitHub Actions und GitHub Pages | getrennte statische Testseite |

Es gibt keine neue npm-Abhängigkeit, keine externe KI, keinen OpenAI-Aufruf, keinen API-Schlüssel,
keine neue Cloud-Laufzeit und keine laufenden Kosten.

## Datenschutz- und Fehlergrenze

- Vor jedem Zuhören erklärt RHIA, dass der Browser Sprache an seinen Anbieter übertragen kann.
- RHIA speichert weder Audio noch das erkannte Transkript.
- Die Mikrofontaste ist nur während eines einzelnen Befehls aktiv und zeigt diesen Zustand an.
- Fehlende Browserunterstützung, verweigerte Berechtigung, kein erkennbares Signal und
  Netzwerkfehler werden sichtbar gemeldet.
- Es gibt keinen stillen Ersatzdienst. Textbedienung und Cockpit bleiben immer nutzbar.
- Die öffentliche Testseite darf ausschließlich künstliche Testdaten enthalten.

## Abnahme

Vor der Übergabe müssen `pnpm check`, GitHub-CI und der vorbereitete Browser-Smoke grün sein. Sir
prüft anschließend gemäß `docs/tests/RHIA_BETRIEBSSTART_SCHNELLTEST.md` Begrüßung, Cockpit,
bestätigte Aufgabenerfassung, Neustartpersistenz, Mikrofonhinweis, unterstützte Sprachbefehle und
responsive Bedienung.

Eine nicht unterstützte Browser-Spracherkennung ist kein versteckt zu umgehender Fehler. Sie
blockiert die Sprachabnahme auf diesem Gerät und wird als reale Geräteanforderung für den späteren
Wake-Word-Aufbau dokumentiert.

## Rücknahme

Der Betriebsstart liegt auf dem getrennten Branch `agent/rhia-firmenassistent-test`. Solange Sir
keinen Merge freigibt, besteht die Rücknahme im Schließen des Draft-PR. `main`, die beiden
Stufe-4-Branches, Dexie-Schema, Sicherungsformat und vorhandene Browserdaten bleiben unverändert.
