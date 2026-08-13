# Abnahmeprotokoll – Stufe 4 Schnellabnahme Planung und Briefings

Stand: 10.08.2026

## Verbindliche Projektentscheidung

Sir hat am 10.08.2026 die frühere Regel „fünf aufeinanderfolgende Alltagstests an fünf realen
Kalendertagen“ ausdrücklich aufgehoben. Stufe 4 wird stattdessen durch fünf logisch
aufeinanderfolgende Planungs- und Feedbackzyklen innerhalb einer Testsitzung abgenommen.

Die Schnellabnahme weist die Funktion und lokale Persistenz von Stufe 4 nach. Sie behauptet keinen
fünftägigen Langzeitbetrieb. Dieser Langzeitnachweis wird für den Abschluss von Stufe 4 nicht mehr
verlangt.

Technische Fertigstellung und grüne CI schließen Stufe 4 weiterhin nicht allein ab. Bis Sir alle
fünf Zyklen und den Geräte-Smoke bestätigt hat, bleiben Stufe 4 offen, Stufe 5 gesperrt und PR #6
Draft und ungemergt.

## Durchführungsregel

- Der begleitende Arbeitschat gibt immer genau einen Testschritt aus.
- Sir antwortet nur mit `passt`, `Fehler` oder einem Screenshot.
- Nach `Fehler` stoppt die Abnahme sofort. Erst Ursache bestimmen, dann über Fortsetzung oder
  Neustart des betroffenen Zyklus entscheiden.
- Zwischen zwei bestandenen Prüfschritten findet keine Entwicklung statt.
- Nach Beginn der Schnellabnahme bleiben Produktcode und aktive Testanweisung unverändert.
- Ausschließlich künstliche Daten verwenden.
- Alle fünf Zyklen im selben normalen Browser auf demselben Hauptgerät durchführen.
- Zwischen Z02 und Z03 alle RHIA-Tabs und die PWA vollständig schließen und RHIA neu öffnen.
- Ein zweiter vollständiger Neustart erfolgt nach Sicherungswiederherstellung in Z05.

## Sicherheits- und Systemgrenzen

- Testadresse: `https://ggrlak-04872.github.io/RHIA-2/`;
- erwartete Anzeige: Version `0.4.1`, Stufe `4`, Datenquelle `IndexedDB`, OpenAI API `Deaktiviert`;
- keine persönlichen, produktiven oder vertraulichen Testdaten;
- keine externe KI, Cloud-Datenquelle, Synchronisation, Kalender-, Datei-, E-Mail- oder
  Kontaktintegration;
- GitHub Pages liefert nur die statische App und ist keine Geschäftsdatenquelle;
- kein Merge nach `main` ohne separate ausdrückliche Freigabe;
- keine Stufe 5 ohne separate ausdrückliche Freigabe.

## Technische Tore vor der Schnellabnahme

| Prüfung | Verbindlicher Nachweis |
|---|---|
| lokaler Gesamtcheck | 102/102 Vitest-Tests, TypeScript, Build und Audits bestanden |
| Browser-E2E | 18/18 auf Tablet-, Handy- und Desktopprojekten bestanden |
| geprüfter Regeländerungscommit | `4785ff061252a0e702783eca6b2c16244603f589` |
| CI | CI #69 vollständig erfolgreich; 18/18 Browserfälle |
| Pages | Deployment #53 vollständig erfolgreich |
| Datenbank | additive Dexie-Migration 4 auf 5 automatisiert bestanden |
| Sicherung | Format 4 und Migration der Formate 1 bis 3 automatisiert bestanden |
| externe Quellen | öffentlicher Build-Audit ohne externe KI, Cloud-API oder versteckte Datenquelle |

Die reine Dokumentationsänderung dieser Abnahmeregel besitzt grüne CI und Pages. Der begleitende
Chat prüft vor Testbeginn zusätzlich, dass PR #6 weiterhin offen, Draft und ungemergt ist.

## Testvariablen

Der begleitende Chat nennt vor der ersten Eingabe die konkreten Kalenderdaten:

- `T`: Datum der Testsitzung;
- `T+1`: Folgetag;
- `T+2`: zweiter Folgetag;
- `W`: Montag der Kalenderwoche von `T`.

Alle fünf Planungszyklen dürfen dasselbe simulierte Datum `T` verwenden. Das Warten auf fünf reale
Tage ist ausdrücklich nicht erforderlich.

## Sauberer Ausgangszustand

Vor Z01 wird ein möglicherweise vorhandener lokaler Bestand gesichert. Danach wird ausschließlich
mit Zustimmung von Sir ein sauberer lokaler Testbestand hergestellt. Die Sicherung wird nicht in
Git hochgeladen und nicht an Dritte gesendet.

Nach der Bereinigung müssen genau die vier automatisch angelegten Pflichtbereiche vorhanden sein:
Privat, RH Produktion, RHIA und Shadow Grown. Weitere alte Aufgaben dürfen den Test nicht
beeinflussen.

## Künstliche Aufgaben

Vier Aufgaben werden ohne Projekt und Ziel angelegt. Jede Aufgabe wird über die sichtbare
Bestätigungsbox gespeichert.

| Kürzel | Bereich | Titel | Status | Frist | Wichtigkeit | Aufwand | Geldwirkung |
|---|---|---|---|---|---|---:|---|
| A | Privat | `S4-A Künstliche Frist` | Geplant | T | Hoch | 60 Min. | Keine |
| B | Privat | `S4-B Künstliche Voraussetzung` | Geplant | T+1 | Mittel | 30 Min. | Keine |
| C | Privat | `S4-C Künstliche Folge` | Geplant | T+2 | Hoch | 45 Min. | Keine |
| D | RH Produktion | `S4-D Künstliche Reserve` | Geplant | keine | Mittel | 45 Min. | Hoch; 10 Euro bis T+2 |

Danach:

1. C über `Wartet auf` von B abhängig machen.
2. Für C den manuellen Rang `1` eingeben, `Rang ausdrücklich bestätigen` aktivieren und
   `Rang setzen` wählen.
3. Prüfen: C zeigt die offene Abhängigkeit zu B und die manuelle Rangentscheidung bleibt sichtbar.

## Z01 – Wochenregel, Frist, Abhängigkeit und erstes Feedback

1. In `Wochenplanung` eintragen: Wochenbeginn `W`, täglicher Start `18:00`, Mo–Fr `120`, Sa/So
   `60`; dann `Woche vorschlagen`.
2. Prüfen: `720 Min.` verfügbar und `150 Min.` Schutzzeit. RHIA und Shadow Grown erhalten jeweils
   mindestens 60 Minuten; ein 60-Minuten-Block wird bevorzugt.
3. Prüfen: Die Erklärung nennt Fristen, Wichtigkeit, Blockaden, Geldwirkung, Aufwand und
   Schutzzeit. C darf wegen der offenen Abhängigkeit nicht als Aufgabenblock erscheinen.
4. In `Morgenbriefing` eintragen: Tag `T`, verfügbar `09:00` bis `13:00`; dann
   `Tagesplan vorschlagen`.
5. Prüfen: A wird wegen der nahen Frist berücksichtigt, C bleibt blockiert und verfügbare,
   geplante und geschützte Minuten sind sichtbar.
6. Bei A speichern: Ergebnis `Teilweise erledigt`, Grund `Zeit war zu kurz`, tatsächliche Minuten
   `30`, Notiz `Z01 künstlich`.

Erfolg Z01: Wochen- und Tagesplanung sind begründet, Schutzzeit und Blockade stimmen, erstes
Feedback ist sichtbar gespeichert.

## Z02 – Feedbackwirkung und Entblockungsentscheidung

1. Erneut einen Tagesplan für `T`, `09:00` bis `13:00` erzeugen.
2. Prüfen: A erscheint mit `90` Minuten. Die Blockbegründung nennt die letzte Rückmeldung.
3. Bei A speichern: Ergebnis `Erledigt`, Grund `Kein besonderer Grund`, tatsächliche Minuten `90`,
   Notiz `Z02 künstlich`.
4. Unter `Korrektur, manuelle Priorität und Papierkorb` bei B den Status `Erledigt` wählen und
   `Korrektur speichern`.
5. Prüfen: B bleibt auf `Erledigt`; der manuelle Rang von C ist weiterhin gesetzt. Dass die
   Abhängigkeit fachlich aufgelöst ist, wird im unmittelbar folgenden Vorschlag Z03 geprüft.
6. Für `T` einen Abendrückblick erstellen und prüfen, dass er Rückmeldungen sichtbar zusammenfasst.
7. Alle RHIA-Tabs und eine installierte PWA vollständig schließen. Browser beenden, neu öffnen und
   die Testadresse erneut laden.
8. Prüfen: Version, Stufe, IndexedDB und deaktivierte API stimmen; Wochenplanung und die bisherigen
   Briefings stehen im `Briefing-Verlauf`; B bleibt erledigt und der manuelle Rang von C bleibt
   erhalten.

Erfolg Z02: Das Z01-Feedback beeinflusst den unmittelbar folgenden Vorschlag. Aufgabe,
Planungsdaten, Feedback und manuelle Entscheidung überstehen einen vollständigen Neustart.

## Z03 – Persistenter Zustand und entblockte manuelle Priorität

1. Tagesplan für `T`, `09:00` bis `13:00` erzeugen.
2. Prüfen: A wird nach dem erledigten Feedback nicht erneut vorgeschlagen. C kann nach Erledigung
   von B eingeplant werden und ist als manuell geschützte Priorität weiterhin nachvollziehbar.
3. Bei C speichern: Ergebnis `Ausgelassen`, Grund `Blockade aufgetreten`, tatsächliche Minuten `0`,
   Notiz `Z03 künstlich`.

Erfolg Z03: Der neue Zyklus baut nach Neustart auf dem gespeicherten Zustand auf; Abhängigkeit und
manuelle Entscheidung bleiben wirksam.

## Z04 – Blockadefeedback und Zeitkorrektur

1. Tagesplan für `T`, `09:00` bis `13:00` erzeugen.
2. Prüfen: C wird wegen des Blockadefeedbacks aus Z03 nicht erneut vorgeschlagen. D bleibt als
   planbare künstliche Aufgabe verfügbar.
3. Bei D speichern: Ergebnis `Teilweise erledigt`, Grund `Zeit war zu lang`, tatsächliche Minuten
   `15`, Notiz `Z04 künstlich`.
4. Hauptgerät ins Hoch- und Querformat drehen. Formulare, Begründungen, Rückmeldungen und
   Hauptschaltflächen dürfen nicht abgeschnitten oder horizontal unbedienbar sein.

Erfolg Z04: Blockadefeedback schließt C sichtbar aus; D erhält eine gespeicherte Zeitkorrektur und
die Bedienung bleibt responsiv.

## Z05 – Fehleranzeige, Folgevorschlag, Papierkorb und Sicherung

1. Im Morgenbriefing für `T` absichtlich `13:00` bis `09:00` eingeben und
   `Tagesplan vorschlagen` wählen.
2. Prüfen: RHIA zeigt einen sichtbaren Planungsfehler. Es darf kein neuer Vorschlag als Erfolg
   erscheinen.
3. Zeiten auf `09:00` bis `13:00` korrigieren und erneut `Tagesplan vorschlagen` wählen.
4. Prüfen: D wird aufgrund des Z04-Feedbacks mit `15` Minuten vorgeschlagen; die Begründung nennt
   die letzte Rückmeldung. A und C bleiben ausgeschlossen.
5. Bei D speichern: Ergebnis `Erledigt`, Grund `Kein besonderer Grund`, tatsächliche Minuten `15`,
   Notiz `Z05 künstlich`.
6. Den aktuellen Morgenplan mit `In Papierkorb` verschieben und im Planungs-`Papierkorb`
   `Wiederherstellen` wählen. Briefing, Blöcke und Z05-Rückmeldung müssen gemeinsam zurückkehren.
7. Für `T` einen Abendrückblick erstellen und prüfen, dass er ohne Fehler angezeigt wird.
8. Unter `Sicherung und Löschung` `Sicherung exportieren` wählen. Der Dateiname muss
   `rhia-backup-YYYY-MM-DD.json` entsprechen.
9. Exakt `RHIA LOKALDATEN LÖSCHEN` eingeben und `Alle lokalen Daten löschen` wählen. Danach nicht
   neu laden.
10. Sofort `Sicherung prüfen` wählen und die eben exportierte Datei auswählen. Es müssen
    `0 Importkonflikte` erscheinen; dann `Konfliktfrei importieren` wählen.
11. Alle RHIA-Tabs und die PWA vollständig schließen, Browser neu öffnen und Testadresse laden.
12. Prüfen: vier Testaufgaben, manuelle Rangentscheidung, Wochenplanung, fünf Morgenzyklen,
    Feedback, Abendrückblick und wiederhergestellte Planung sind weiterhin nachvollziehbar.

Erfolg Z05: Fehler werden sichtbar gemeldet; Z04 beeinflusst Z05; Papierkorb sowie
Sicherungs-Export, validierter Import und Persistenz nach Neustart funktionieren für Stufe 4.

## Handy-Smoke innerhalb derselben Testsitzung

1. Testadresse auf dem Handy in einem privaten Tab öffnen.
2. Version `0.4.1`, Stufe `4`, `IndexedDB` und deaktivierte API prüfen.
3. Prüfen: Die Daten des Hauptgeräts erscheinen nicht automatisch. Das bestätigt die vorgesehene
   lokale Datenquelle und fehlende Mehrgerätesynchronisation in Stufe 4.
4. Mit ausschließlich künstlichen Werten einen Tagesplan erzeugen und Hoch- sowie Querformat
   prüfen. Keine Hauptaktion darf abgeschnitten sein.
5. Privaten Tab schließen.

## Abnahmematrix

| Nachweis | Z01 | Z02 | Z03 | Z04 | Z05/Smoke |
|---|---:|---:|---:|---:|---:|
| Tages- und Wochenplanung | ✓ | ✓ | ✓ | ✓ | ✓ |
| Fristen, Zeit, Blockade, Abhängigkeit | ✓ | ✓ | ✓ | ✓ | ✓ |
| Schutzzeit RHIA und Shadow Grown | ✓ |  |  |  | ✓ |
| Feedback beeinflusst Folgevorschlag |  | ✓ | ✓ | ✓ | ✓ |
| manuelle Entscheidung bleibt erhalten | ✓ | ✓ | ✓ |  | ✓ |
| vollständiger Neustart / Persistenz |  | ✓ | ✓ |  | ✓ |
| nur lokale Datenquelle / keine externe KI | ✓ | ✓ |  |  | ✓ |
| Papierkorb und Sicherung |  |  |  |  | ✓ |
| sichtbare Fehler |  |  |  |  | ✓ |
| responsive Gerätefähigkeit |  |  |  | ✓ | ✓ |

## Abschlussentscheidung

Stufe 4 ist funktional bestanden, wenn:

- [x] technische Tests, CI und Pages vor Testbeginn grün sind;
- [ ] Z01 bestanden;
- [ ] Z02 einschließlich vollständigem Neustart bestanden;
- [ ] Z03 bestanden;
- [ ] Z04 bestanden;
- [ ] Z05 einschließlich Export, Rückimport und Neustart bestanden;
- [ ] Handy-Smoke bestanden;
- [ ] kein offener Abnahmefehler besteht;
- [ ] Sir Stufe 4 ausdrücklich als bestanden bestätigt.

Ein bestandener Schnelltest erlaubt keinen automatischen Merge. Nach der Bestätigung werden
Projektstand und Abnahme dokumentiert. PR #6 bleibt bis zu Sirs separater Merge-Freigabe Draft und
ungemergt. Stufe 5 bleibt bis zu Sirs separater Stufe-5-Freigabe vollständig gesperrt.
