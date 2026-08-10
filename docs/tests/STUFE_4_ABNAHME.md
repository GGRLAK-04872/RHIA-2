# Abnahmeprotokoll – Stufe 4 Planung und Briefings

Stand: 10.08.2026

Stufe 4 ist zur technischen Umsetzung freigegeben. Dieses Protokoll trennt die technische Prüfung
von der verbindlichen realen Abnahme durch Sir. Technische Fertigstellung, grüne CI und eine
erreichbare Preview schließen Stufe 4 nicht ab. Dafür sind fünf aufeinanderfolgende Alltagstests
erforderlich. Bis zu deren ausdrücklicher Bestätigung bleiben Stufe 4 offen, Stufe 5 gesperrt und
der Stufe-4-PR ungemergt.

## Sicherheits- und Testgrenzen

- ausschließlich die getrennte RHIA-2-Testadresse verwenden;
- ausschließlich die unten beschriebenen künstlichen Daten eingeben;
- keine persönlichen, produktiven oder vertraulichen Inhalte verwenden;
- für die fünf Tage denselben Browser auf demselben Hauptgerät verwenden, damit lokale
  Rückmeldungen und Folgevorschläge zusammenhängend geprüft werden;
- IndexedDB ist die einzige Datenquelle; ein zweites Gerät erhält absichtlich keine Daten;
- OpenAI API, externe KI, Cloud-Sync, Kalender, Dateien, E-Mail und Kontakte bleiben deaktiviert;
- keine externe Aktion, Veröffentlichung oder laufende Ausgabe auslösen;
- kein Merge nach `main` ohne separate ausdrückliche Freigabe von Sir.

## Technische Tore

| Prüfung | Erwartung | Stand |
|---|---|---|
| lokale Gesamtprüfung | Format/Lint, TypeScript, 102 Vitest-Tests, Build und Audits | bestanden |
| Browser-E2E | kompletter Playwright-Lauf einschließlich Planung, Feedback und vier Größen | 18/18 in CI #67 bestanden |
| Stufe-4-CI | Qualität/Build und Browser-Smoke auf aec8c4e667703324813aa3818ce18a82cc19745c | CI #67 bestanden |
| öffentlicher Build | keine Secrets, internen Dateien, Alt-APIs oder Cloud-Abhängigkeiten | CI #67 bestanden |
| Preview | Version 0.4.0 und Stufe 4 unter der getrennten Testadresse | Pages #51 bestanden |
| Backup | Format 4; geprüfte Migration der Formate 1 bis 3 | automatisiert bestanden |
| Datenbank | additive Dexie-Migration von Version 4 auf Version 5 | automatisiert bestanden |
| altes Repository | `GGRLAK-04872/RHIA` unverändert | ohne Schreibzugriff; main c6a92d5e226eef9b71940c5b6e699a8f0ec067c2 |

Der lokale Playwright-Lauf konnte in der Work-Umgebung nicht starten, weil kein Chromium vorhanden
ist und der erlaubte Downloadweg ein leeres Archiv liefert. Es wurde kein Browser-Test als
bestanden behandelt. GitHub Actions hat Chromium installiert und den Lauf in CI #67 mit 18 von 18
bestandenen Browserfällen vollständig nachgeholt.

CI #64 und #65 waren sichtbar fehlgeschlagen, weil neue Playwright-Selektoren gleichlautende Texte
mehrdeutig beziehungsweise relativ zum falschen Element gesucht hatten. Nach der Korrektur prüft
CI #67 dieselben Tages-, Wochen-, Feedback-, Abend- und Responsive-Abläufe vollständig grün. Die
Fehlläufe werden nicht als bestanden gewertet.

## Künstliches Testszenario

Vor Tag 1 in der Arbeitszentrale ausschließlich diese Aufgaben anlegen und jede Eingabe sichtbar
bestätigen. `D1` bezeichnet den ersten tatsächlichen Testtag; die Fristen werden relativ dazu im
Datumsfeld gewählt.

| Kürzel | Bereich | Titel | Status | Frist | Wichtigkeit | Aufwand |
|---|---|---|---|---|---|---:|
| A | Privat | `S4-A Künstliche Fristaufgabe` | Geplant | D1 | Hoch | 60 Min. |
| B | Privat | `S4-B Künstliche Voraussetzung` | Geplant | D2 | Mittel | 30 Min. |
| C | Privat | `S4-C Künstliche Folgeaufgabe` | Geplant | D3 | Hoch | 45 Min. |
| R | RHIA | `S4-R Künstlicher RHIA-Block` | Geplant | D4 | Mittel | 60 Min. |
| S | Shadow Grown | `S4-S Künstlicher Shadow-Block` | Geplant | D5 | Mittel | 60 Min. |

Danach C über `Wartet auf` von B abhängig machen. C muss als blockiert erscheinen, bis B in der
Arbeitszentrale ausdrücklich auf `Erledigt` gesetzt wird. Geldwirkung bleibt bei allen fünf
Aufgaben `Keine`; Projekte und Ziele sind für diesen Test nicht erforderlich.

## Verbindliche Fünf-Tage-Regel

- Die Tests D01 bis D05 müssen an fünf aufeinanderfolgenden Kalendertagen stattfinden.
- Jeder Tag verwendet den tatsächlichen Tag im Morgenbriefing und Abendrückblick.
- Browser und PWA zwischen Morgen- und Abendprüfung mindestens einmal vollständig schließen.
- Ein Fehler stoppt die Abnahme sofort. Fehlerbild, Gerät und Schritt dokumentieren; nach einer
  Korrektur beginnt eine neue Folge wieder bei D01.
- Bei jedem Vorschlag Begründung, verfügbare/geplante Minuten und Schutzzeit auf Plausibilität
  prüfen. Nicht nur das Vorhandensein eines Blocks bestätigen.

## D01 – Wochenbasis und erste Rückmeldung

Geschätzte Dauer: 15 Minuten.

1. Testseite öffnen und im Kopf Version `0.4.0`, Stufe `4`, `IndexedDB` und deaktivierte API prüfen.
2. Falls nötig das künstliche Testszenario vollständig anlegen.
3. In `Wochenplanung` D1 als Wochenbeginn, Start `18:00`, werktags `120` und Wochenende `60`
   eintragen und `Woche vorschlagen` wählen.
4. Prüfen: 720 Minuten verfügbar, 150 Minuten Schutzzeit, mindestens 60 Minuten RHIA und mindestens
   60 Minuten Shadow Grown. Ein 60-Minuten-Block wird bevorzugt; ein Rest darf 30 Minuten sein.
5. Prüfen, dass C wegen der offenen Abhängigkeit nicht als Aufgabenblock vorgeschlagen wird und die
   Erklärung Fristen, Wichtigkeit, Blockaden, Geldwirkung, Aufwand und Schutzzeit nennt.
6. Morgenbriefing für D1 mit `09:00` bis `12:00` erzeugen. Für Aufgabe A `Teilweise erledigt`, Grund
   `Zeit war zu kurz`, 30 tatsächliche Minuten und Notiz `D01 künstlich` speichern.
7. Browser vollständig schließen, neu öffnen und prüfen, dass Vorschlag und Rückmeldung lokal
   erhalten sind.
8. Abendrückblick für D1 erstellen und `1 teilweise` kontrollieren.

## D02 – Rückmeldung beeinflusst den Folgevorschlag

Geschätzte Dauer: 10–15 Minuten.

1. Morgenbriefing für D2 mit `09:00` bis `13:00` erzeugen.
2. Prüfen, dass Aufgabe A wegen D01 erneut und mit 90 statt 60 Minuten vorgeschlagen wird. Die
   Blockbegründung muss die letzte Rückmeldung nennen.
3. Für A `Erledigt`, Grund `Kein besonderer Grund`, 90 Minuten und Notiz `D02 künstlich` speichern.
4. In der Arbeitszentrale Aufgabe B ausdrücklich auf Status `Erledigt` korrigieren. Prüfen, dass die
   Abhängigkeit von C nicht mehr als offen angezeigt wird.
5. Abendrückblick für D2 erstellen und die erledigte Rückmeldung kontrollieren.

## D03 – Entblockung und falsche Priorität

Geschätzte Dauer: 10 Minuten.

1. Morgenbriefing für D3 mit `09:00` bis `12:00` erzeugen.
2. Prüfen, dass A nach der erledigten Rückmeldung nicht erneut erscheint und C nach Erledigung von B
   nun vorgeschlagen werden kann.
3. Für C `Ausgelassen`, Grund `Priorität passte nicht`, 0 Minuten und Notiz `D03 künstlich`
   speichern.
4. Abendrückblick erstellen und genau eine ausgelassene Rückmeldung für diesen Testtag prüfen.

## D04 – Blockadefeedback und responsive Bedienung

Geschätzte Dauer: 10–15 Minuten.

1. Morgenbriefing für D4 mit `09:00` bis `13:00` erzeugen und prüfen, dass die D03-Rückmeldung in
   Reihenfolge oder Erklärung berücksichtigt wird.
2. Für einen vorgeschlagenen künstlichen Aufgabenblock `Ausgelassen`, Grund `Blockade aufgetreten`,
   0 Minuten und Notiz `D04 künstlich` speichern.
3. Auf dem Hauptgerät Hoch- und Querformat prüfen: Formulare, Begründungen, Rückmeldung und
   Hauptaktionen dürfen keinen horizontalen Überlauf oder verdeckte Schaltflächen zeigen.
4. Abendrückblick erstellen und die Blockaderückmeldung kontrollieren.

## D05 – Ausschluss, Verlauf und lokale Wiederherstellung

Geschätzte Dauer: 15 Minuten.

1. Morgenbriefing für D5 mit `09:00` bis `13:00` erzeugen. Die an D04 als blockiert gemeldete Aufgabe
   darf nicht erneut vorgeschlagen werden.
2. Schutzzeit und Begründung erneut plausibilisieren; RHIA und Shadow Grown dürfen nicht still aus
   der Wochenplanung verschwunden sein.
3. Für einen aktuellen Block `Teilweise erledigt`, Grund `Anderer Grund`, 15 Minuten und Notiz
   `D05 Wiederherstellung künstlich` speichern. Danach `Briefing-Verlauf` öffnen und die Briefings
   aller fünf Tage nachvollziehen.
4. Das aktuelle Morgenbriefing in den Papierkorb verschieben, Seite neu laden und es aus `Papierkorb`
   wiederherstellen. Briefing, Blöcke und Rückmeldungen müssen gemeinsam zurückkehren.
5. Eine Sicherung exportieren. Der Dateiname muss `rhia-backup-YYYY-MM-DD.json` entsprechen; keine
   Datei veröffentlichen oder an Dritte senden.
6. Abendrückblick für D5 erstellen und den Browser erneut schließen und öffnen. Alle fünf Tage
   müssen lokal nachvollziehbar bleiben.

## Zusätzlicher Handy-Smoke ohne Geräteabgleich

Geschätzte Dauer: 5 Minuten; einmal während D01 bis D05 möglich.

1. Testseite auf dem Handy zuerst in einem privaten Tab öffnen.
2. Prüfen, dass die Daten des Hauptgeräts nicht automatisch erscheinen.
3. Mit ausschließlich künstlichen Werten einen Tagesplan erzeugen und Hoch- sowie Querformat
   prüfen. Keine Aktion darf horizontal abgeschnitten sein.
4. Den privaten Tab schließen. Dieser Smoke gehört zur Gerätefähigkeit, nicht zur fortlaufenden
   Datenreihe des Hauptgeräts.

## Tagesprotokoll durch Sir

| Tag | Datum | Gerät/Browser | Morgenplan plausibel | Schutzzeit plausibel | Feedback gespeichert | Abendrückblick korrekt | Ergebnis/Beobachtung |
|---|---|---|---|---|---|---|---|
| D01 |  |  |  |  |  |  |  |
| D02 |  |  |  |  |  |  |  |
| D03 |  |  |  |  |  |  |  |
| D04 |  |  |  |  |  |  |  |
| D05 |  |  |  |  |  |  |  |

## Abschluss

- [x] finaler Feature-Commit vollständig lokal geprüft
- [x] GitHub-CI einschließlich aller Browser-E2E-Tests grün
- [x] Preview zeigt exakt den geprüften Feature-Commit und Version 0.4.0
- [ ] D01 bis D05 an fünf aufeinanderfolgenden Tagen bestanden
- [ ] zusätzlicher Handy-Smoke bestanden
- [ ] Sir bestätigt Stufe 4 ausdrücklich
- [ ] separate Merge-Freigabe von Sir liegt vor

Vor Erfüllung aller Punkte darf Stufe 4 nicht als endgültig abgeschlossen gelten. Stufe 5 bleibt
vollständig gesperrt.
