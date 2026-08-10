# RHIA 2.0 – Start Here

> Diese Datei ist die einzige lebende Übergabe für neue RHIA-2-Arbeitschats. Zusammen mit
> docs/RHIA_MASTER_AUFBAUPLAN_2.2.md bildet sie das vollständige aktive Übergabesystem.

## Aktueller Projektstand

| Feld | Verbindlicher Stand |
|---|---|
| Datum | 10.08.2026 |
| Repository | GGRLAK-04872/RHIA-2 |
| Verbindlicher Branch | agent/stufe-4-planung-briefings |
| Aktueller main-Commit | 25c445668651ccd6077b5ffcfce66d839c4f151d |
| Letzter verifizierter Funktionsstand auf main | 4e86426870e7eba7e309a365a986be5a3a3e6a6e |
| Letzter verifizierter Stufe-4-Funktionsstand | aec8c4e667703324813aa3818ce18a82cc19745c |
| Geprüfter Dokumentationsstand der Schnellabnahmeregel | 4785ff061252a0e702783eca6b2c16244603f589 |
| Draft-PR | #6 offen, ungemergt, gegen main |
| Produktversion | 0.4.0 auf dem Stufe-4-Branch und der Testseite; 0.3.0 auf main |
| Aktive Stufe im Produkt | 4 auf dem Stufe-4-Branch und der Testseite; 3 auf main |
| Abgeschlossene Entwicklungsstufen | 0, 1, 2 und 3 |
| Nächster Abnahmeschritt | fünf Planungs- und Feedbackzyklen in einer Schnellabnahme durch Sir |
| Datenbankschema | Dexie-Version 5 auf dem Stufe-4-Branch |
| Sicherungsformat | rhia-backup Version 4 auf dem Stufe-4-Branch |
| Testseite | https://ggrlak-04872.github.io/RHIA-2/ |
| Aktive Datenquelle | lokale IndexedDB des jeweiligen Browsers |
| Projektphase | Stufe 4 technisch vollständig umgesetzt und geprüft; reale Abnahme offen |
| Letzte technische Tore | CI #69 mit 18/18 Browserfällen und Pages #53 auf Regeländerungscommit 4785ff061252a0e702783eca6b2c16244603f589 vollständig erfolgreich |
| Offene reale Abnahme | Schnellabnahme mit fünf Zyklen, Neustartpersistenz und Handy-Smoke durch Sir |

Der Commit 4e86426870e7eba7e309a365a986be5a3a3e6a6e ist der letzte technisch geprüfte
Funktionsstand auf main. Er enthält Stufe 3.1 bis 3.9 als Squash-Merge von PR #5. Spätere reine
Änderungen an diesen beiden Übergabedateien gehören ausschließlich zum Dokumentationsstand und
verändern den Funktionsstand nicht.

Das alte Repository GGRLAK-04872/RHIA bleibt unverändert und darf nicht beschrieben werden.

## Abgeschlossene Stufen

### Stufe 0 – Neustartbasis

Vollständig abgeschlossen, real im Android-Browser abgenommen und in main integriert.

### Stufe 1 – Local-first-Datenfundament

Vollständig abgeschlossen, auf Tablet und Handy abgenommen und in main integriert. Enthalten sind
Area, Source, Note, AuditEntry, lokale IndexedDB, Revisionen, Audit, 30-Tage-Papierkorb,
Wiederherstellung, bestätigte Gesamtlöschung sowie Export und Import mit SHA-256 und
Konfliktschutz.

### Stufe 2 – Gedächtnis v1

Vollständig abgeschlossen, technisch geprüft, auf Tablet und Handy abgenommen und über PR #3 per
Squash-Merge in main integriert. Fakten und Entscheidungen werden nur nach ausdrücklicher
Bestätigung aktiv; Korrekturhistorie, Konfliktauflösung, Suche, Filter und Sicherungsformat 2 sind
enthalten.

### Stufe 3 – Arbeitszentrale

**Status:** vollständig abgeschlossen, technisch geprüft, real abgenommen und über PR #5 per
Squash-Merge in main integriert.

Enthalten sind:

- Project, Goal, Task und TaskDependency mit strikten Domänen- und Zod-Regeln;
- die vier Pflichtbereiche Privat, RH Produktion, RHIA und Shadow Grown;
- strukturierte Status-, Frist-, Wichtigkeits-, Aufwands-, Geldwirkungs- und Blockadefelder;
- azyklische Aufgabenabhängigkeiten mit sichtbarer Blockade und Entblockung;
- deterministische und verständlich begründete Priorisierung;
- ausdrücklich bestätigte, geschützte manuelle Rangentscheidungen von Sir;
- responsive Inbox-, Projekt-, Fokus-, Alle-, Such- und Filteransichten;
- sichtbare Anlage und Korrektur von Projekten, Zielen, Aufgaben und Abhängigkeiten;
- Dexie-Version 4 mit additiver Migration und Erhalt der Stufe-1- und Stufe-2-Daten;
- Sicherungsformat 3 mit Migration gültiger Formate 1 und 2;
- erweiterter Audit, 30-Tage-Papierkorb, Wiederherstellung und Gesamtlöschung;
- Speicherung realer Aufgaben nur nach sichtbarer ausdrücklicher Bestätigung;
- erneut validierter und per SHA-256 geschützter Import.

## Abschlussnachweise Stufe 3

| Prüfung | Ergebnis |
|---|---|
| Feature-Head vor Merge | eabe91b94a5e4356ea69d87e961a07838247acf4 |
| Feature-CI | CI #61 vollständig erfolgreich |
| Squash-Merge | PR #5 als 4e86426870e7eba7e309a365a986be5a3a3e6a6e in main integriert |
| main-CI nach Merge | CI #62 vollständig erfolgreich |
| Qualität und Build | erfolgreich |
| Browser- und Responsive-Smoke | erfolgreich |
| Pages-Deployment nach Merge | Deployment #46 vollständig erfolgreich |
| Öffentliche Testseite | HTTP 200; Version 0.3.0, Stufe 3 lokal und Arbeitszentrale ausgeliefert |
| Tablet | T01 bis T14 bestanden |
| Handy | H01 bis H05 bestanden |
| Gesamtergebnis Stufe 3.9 | BESTANDEN |
| Offene Abnahmefehler | keine |

Die reale Abnahme bestätigte Pflichtbereiche, Projekt- und Zielanlage, vollständige
Aufgabenerfassung, Bestätigungsschutz, Abhängigkeiten, Blockaden, automatische Priorisierung,
geschützte manuelle Rangfolge, Ansichten, Suche, Filter, Korrektur, lokale Persistenz,
Papierkorb, Wiederherstellung, Export, Konfliktschutz, Gesamtlöschung, Import sowie Hoch- und
Querformat auf Tablet und Handy.

## Bekannte Beobachtungen ohne offenen Fehler

- Auf dem Handy wurde zunächst aus dem Browsercache noch eine ältere Version 0.2.x angezeigt. In
  einem privaten Tab wurde anschließend korrekt Version 0.3.0 und Stufe 3 geladen. Die Abnahme
  erfolgte vollständig auf Version 0.3.0.
- Tablet- und Handybestände sind bis Stufe 5 bewusst lokal getrennt. Unterschiedliche
  Gedächtniseinträge auf beiden Geräten sind deshalb derzeit kein Fehler.
- Eine bereits geöffnete oder installierte PWA kann nach einem Deployment vorübergehend einen
  älteren Cache anzeigen. Vor einer Fehlerbewertung alle RHIA-Tabs und den Browser schließen und
  die Seite neu öffnen. Falls weiterhin eine alte Version erscheint, einen privaten Tab verwenden.

## Technisch umgesetzte Stufe 4

Sir hat Stufe 4 – Planung und Briefings – am 10.08.2026 ausdrücklich freigegeben. Auf dem eigenen
Branch sind `WorkBlock`, `Briefing` und `PlanningFeedback`, begründete Tages- und Wochenplanung,
Morgenbriefing, Abendrückblick, lokales Planungsfeedback und die verbindliche Schutzzeit technisch
umgesetzt. Dexie-Version 5 und Sicherungsformat 4 erweitern den Stufe-3-Stand additiv; Formate 1 bis
3 bleiben importierbar.

Der vollständige lokale Prüflauf ist mit Format/Lint, TypeScript, 102 Vitest-Tests,
Produktions-/PWA-Build, öffentlichem Build-Audit, Secret-Scan und Dependency-Audit grün. Der lokale
Playwright-Lauf konnte nicht starten, weil in der Work-Umgebung kein Chromium vorhanden ist und der
erlaubte Downloadweg ein leeres Archiv liefert. GitHub-CI #67 hat diesen offenen Lauf mit
installiertem Chromium nachgeholt: Qualität/Build und 18 von 18 Browser-/Responsive-Tests sind
erfolgreich. Pages #51 hat exakt Funktionscommit aec8c4e667703324813aa3818ce18a82cc19745c
erfolgreich gebaut, öffentlich geprüft und bereitgestellt.

## Technische Nachweise Stufe 4

| Prüfung | Ergebnis |
|---|---|
| Verifizierter Feature-Commit | aec8c4e667703324813aa3818ce18a82cc19745c |
| Draft-PR | #6 offen, Draft, ungemergt; Basis main 25c445668651ccd6077b5ffcfce66d839c4f151d |
| Lokale Gesamtprüfung | 102/102 Vitest-Tests, TypeScript, Build und alle Audits erfolgreich |
| Feature-CI | CI #67: Qualität/Build und Browser-Smoke vollständig erfolgreich |
| Browser-/Responsive-Test | 18/18 auf Tablet-, Handy- und Desktopprojekten; vier Viewports geprüft |
| Pages | Deployment #51 vollständig erfolgreich |
| Öffentliche Testseite | HTTP 200; Version 0.4.0, Stufe 4, IndexedDB und Planung ausgeliefert |
| Live-Funktionsprüfung | Tagesplan und begründeter Schutzblock auf der Testseite erfolgreich |
| PWA-Cache | alte Version im offenen Testtab reproduziert; frischer Build nach vollständigem Tabwechsel |
| Altes Repository | GGRLAK-04872/RHIA blieb ohne Schreibzugriff; main c6a92d5e226eef9b71940c5b6e699a8f0ec067c2 |
| Offene technische Fehler | keine |

Sir hat am 10.08.2026 die frühere Abnahme über fünf reale Kalendertage ausdrücklich ersetzt. Die
endgültige Abnahme von Stufe 4 bleibt gesperrt, bis Sir fünf logisch aufeinanderfolgende Planungs-
und Feedbackzyklen innerhalb einer Testsitzung einschließlich vollständigem Schließen und
Wiederöffnen selbst durchgeführt und bestätigt hat. Die Schnellabnahme weist Funktion und lokale
Persistenz nach, nicht einen fünftägigen Langzeitbetrieb. Dieser Langzeitnachweis ist für Stufe 4
nicht mehr erforderlich. Ein Merge nach `main` benötigt weiterhin eine separate ausdrückliche
Merge-Freigabe. Stufe 5 bleibt vollständig gesperrt.

## Aktuelle Sperren

- Stufe 5 und alle späteren Stufen bleiben gesperrt.
- Stufe 4 darf nach technischer Fertigstellung nicht ohne fünf bestätigte Planungs- und
  Feedbackzyklen der Schnellabnahme als endgültig abgeschlossen gelten.
- OpenAI API und andere externe KI bleiben technisch deaktiviert.
- Das API-Budget bleibt bei 0 Euro, bis Sir einen Kostenrahmen ausdrücklich freigibt.
- Keine Cloud- oder Mehrgerätesynchronisation vor der dafür vorgesehenen Stufe.
- Keine Cloudflare-Laufzeit, keine Sprache, kein Wake-Word und keine native Android-App.
- Keine Kalender-, Datei-, E-Mail-, Kontakt- oder anderen externen Integrationen.
- Keine externen Aktionen, Käufe, Buchungen oder Veröffentlichungen.
- Keine produktiven oder persönlichen Testdaten auf der öffentlichen Testseite.
- Das alte Repository GGRLAK-04872/RHIA darf nicht verändert werden.
- Kein Merge nach main ohne separate ausdrückliche Freigabe von Sir.

## Nächster erlaubter Schritt

Vor der realen Abnahme stoppen. Sir führt Z01 bis Z05 in einer zusammenhängenden Testsitzung und
den zusätzlichen Handy-Smoke gemäß `docs/tests/STUFE_4_ABNAHME.md` ausschließlich mit künstlichen
Daten durch. Zwischen Z02 und Z03 wird RHIA vollständig geschlossen und neu geöffnet. Erst danach
darf Sir Stufe 4 gesondert abnehmen; ein Merge benötigt eine weitere ausdrückliche Freigabe. Keine
Stufe 5 und kein Merge nach `main`.

## Dauerhafte Zwei-Dateien-Chatwechsel-Regel

Bei jedem neuen RHIA-2-Arbeitschat werden ausschließlich diese beiden Dateien als aktive Übergabe
verwendet:

- docs/RHIA_START_HERE.md;
- docs/RHIA_MASTER_AUFBAUPLAN_2.2.md.

Ein neuer Chat:

1. liest zuerst RHIA_START_HERE.md und danach den Masterplan;
2. prüft den tatsächlichen main-, PR-, CI- und Pages-Stand;
3. unterscheidet Funktionsstand und spätere reine Dokumentationscommits;
4. meldet jede Abweichung sofort und bestimmt ihre Ursache;
5. korrigiert bei Bedarf nur die betroffene Übergabedatei;
6. erstellt kein neues Übergabesystem;
7. fordert keine alten Chatprotokolle oder historischen Masterversionen an;
8. beginnt keine gesperrte Stufe ohne ausdrückliche Freigabe.

## Startanweisung für einen neuen Chat

> Arbeite ausschließlich auf Basis des tatsächlichen Repository-Stands von
> GGRLAK-04872/RHIA-2. Öffne zuerst docs/RHIA_START_HERE.md und danach
> docs/RHIA_MASTER_AUFBAUPLAN_2.2.md. Prüfe anschließend lesend main, spätere reine
> Dokumentationscommits, CI, Pages und alle Sperren. Stufe 3 ist vollständig abgeschlossen und
> über PR #5 als Funktionscommit 4e86426870e7eba7e309a365a986be5a3a3e6a6e in main integriert.
> Stufe 4 ist auf Funktionscommit aec8c4e667703324813aa3818ce18a82cc19745c technisch vollständig
> umgesetzt und durch CI #68 sowie Pages #52 geprüft. Draft-PR #6 bleibt offen und ungemergt. Die
> frühere Fünf-Kalendertage-Regel ist aufgehoben. Führe jetzt keine Entwicklung aus, sondern
> begleite Sir einzelschrittweise durch Z01 bis Z05 der Schnellabnahme aus
> docs/tests/STUFE_4_ABNAHME.md. Verändere weder das alte Repository RHIA noch Sicherheits-,
> Datenschutz- oder Kostengrenzen. Stufe 5 und Merge bleiben gesperrt.

Ein neuer Chat muss sofort melden:

- Stufen 0 bis 3 abgeschlossen;
- Produktversion 0.4.0 und aktive Stufe 4 auf dem Feature-Branch; main bleibt auf 0.3.0/Stufe 3;
- letzter verifizierter Funktionsstand auf main:
  4e86426870e7eba7e309a365a986be5a3a3e6a6e;
- Stufe 3.9 auf Tablet und Handy bestanden, keine offenen Abnahmefehler;
- nächster erlaubter Schritt: Schnellabnahme Z01 bis Z05 mit Neustartpersistenz und Handy-Smoke;
- verboten: Stufe 5, Merge ohne separate Freigabe oder jede Änderung am alten Repository.
