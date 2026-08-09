# RHIA 2.0 – Start Here

> Diese Datei ist die einzige lebende Übergabe für neue RHIA-2-Arbeitschats. Zusammen mit
> `docs/RHIA_MASTER_AUFBAUPLAN_2.2.md` bildet sie das vollständige aktive Übergabesystem.

## Aktueller Projektstand

| Feld | Verbindlicher Stand |
|---|---|
| Datum | 09.08.2026 |
| Repository | `GGRLAK-04872/RHIA-2` |
| Verbindlicher Branch | `main` |
| Aktueller `main`-Commit | `16d1f47f409c7247da5f5bce717514a4f38332c3` |
| Produktversion | `0.2.0` |
| Aktive Stufe im Produkt | `2` |
| Datenbankschema | Dexie-Version 3 |
| Sicherungsformat | `rhia-backup` Version 2 |
| Testseite | <https://ggrlak-04872.github.io/RHIA-2/> |
| Aktive Datenquelle | lokale IndexedDB des jeweiligen Browsers |
| Projektphase | Stufe 2 vollständig abgeschlossen und in `main` integriert |

Der Stand wurde gegen den tatsächlichen GitHub-Commit
`16d1f47f409c7247da5f5bce717514a4f38332c3` geprüft. PR #3 ist geschlossen und gemergt. Das alte
Repository `GGRLAK-04872/RHIA` bleibt unverändert und darf nicht beschrieben werden.

## Abgeschlossene Stufen

### Stufe 0 – Neustartbasis

**Status:** vollständig abgeschlossen, real im Android-Browser abgenommen und in `main`
integriert.

Enthalten sind die getrennte RHIA-2-Neustartbasis, TypeScript-Monorepository, PWA-App-Shell,
sichtbare Fehlergrenze, CI, Browser-Smoke, Secret-/Build-Audit, Architekturentscheidungen und die
getrennte GitHub-Pages-Testseite.

### Stufe 1 – Local-first-Datenfundament

**Status:** vollständig abgeschlossen, auf Tablet und Handy abgenommen und in `main` integriert.

Enthalten sind Area, Source, Note und AuditEntry, Dexie/IndexedDB als einzige Datenquelle,
versionierte Migrationen, Revisionen, 30-Tage-Papierkorb, Wiederherstellung, bestätigte
Gesamtlöschung sowie Export/Import mit SHA-256 und Konfliktschutz.

### Stufe 2 – Gedächtnis v1

**Status:** vollständig abgeschlossen, technisch geprüft, auf Tablet und Handy real abgenommen,
von Sir freigegeben und über PR #3 per Squash-Merge in `main` integriert.

Enthalten sind:

- Fakten und Entscheidungen ausschließlich als inaktive Vorschläge;
- Aktivierung nur nach ausdrücklicher Bestätigung von Sir;
- Ablehnung, Papierkorb und Auditspur;
- Korrekturen mit vollständiger Fassungshistorie;
- sichtbare Widerspruchserkennung und kontrollierte Konfliktauflösung;
- lokale Volltextsuche und strukturierte Filter;
- Sicherungsformat v2 mit allen sieben lokalen Sammlungen;
- erhaltener Import gültiger v1-Sicherungen;
- responsive Bedienung auf Tablet und Handy.

## Aktueller Haltepunkt

**Stufe 3 ist im Masterplan vorbereitet, aber gesperrt.**

Es wurde noch keine Stufe-3-Funktionalität begonnen. Der nächste Arbeitschat darf den Plan und den
tatsächlichen Repository-Stand prüfen, aber ohne ausdrückliche Freigabe weder einen Stufe-3-Branch
anlegen noch Datenmodell, UI, Architektur oder Funktionalität für Stufe 3 ändern.

## Letzte technische Änderungen

- Stufe 2.0–2.9 führte `MemoryFact`, `Decision` und `MemoryConflict` mit strikten Verträgen ein.
- Das veröffentlichte Dexie-Schema wurde additiv auf Version 3 erweitert; Version 2 bleibt als
  Stufe-1-Migrationspfad erhalten.
- Sicherungsformat v2 umfasst Bereiche, Quellen, Notizen, Audit-Einträge, Gedächtnisfakten,
  Entscheidungen und Gedächtniskonflikte.
- Die responsive Gedächtnisoberfläche deckt Vorschlag, Bestätigung, Ablehnung, Korrektur,
  Historie, Papierkorb, Wiederherstellung, Konflikte, Suche und Filter ab.
- Ein CI-Selektor wurde auf das sichtbare Listenelement begrenzt; dadurch laufen Browser- und
  Responsive-Smokes eindeutig.
- Nach dem realen Tablet-Test wurde der Ablauf
  `Korrektur bestätigen -> verwerfen -> wiederherstellen -> erneut bestätigen` idempotent
  repariert und durch einen Regressionstest abgesichert.
- Letzter Feature-Head vor Merge: `5eb8e9ff95d8dd506ada322727428dd102ec8434`.
- PR #3 wurde als Stufe-2-Squash-Commit
  `16d1f47f409c7247da5f5bce717514a4f38332c3` in `main` integriert.

## Letzte Abnahmen

| Prüfung | Ergebnis |
|---|---|
| Tablet | bestanden am 09.08.2026 mit ausschließlich künstlichen Testdaten |
| Handy | bestanden am 09.08.2026 mit ausschließlich künstlichen Testdaten |
| Feature-CI | CI #24 vollständig erfolgreich |
| `main`-CI nach Merge | CI #25 vollständig erfolgreich |
| Build | Produktions- und PWA-Build erfolgreich |
| Qualitätsprüfungen | Format/Lint, TypeScript, Unit-/Integrations-, Browser-/Responsive-Tests und Audits grün |
| Pages | Testseiten-Deployment #16 erfolgreich |
| Testseite | erreichbar; nach Merge mit HTTP 200 bestätigt |
| Öffentlicher Build | keine Secrets, internen Dateien oder Cloud-Laufzeitbestandteile festgestellt |

Die realen Gerätetests bestätigten unter anderem Vorschlag/Bestätigung, Neustartpersistenz,
Korrekturhistorie, Konfliktauflösung, Entscheidung, Suche/Filter, Papierkorb/Wiederherstellung,
Export, Gesamtlöschung, Import sowie Hoch- und Querformat.

## Offene Punkte

1. Stufe 3 benötigt eine ausdrückliche Freigabe von Sir.
2. Nach Freigabe muss zuerst der tatsächliche `main`-Stand erneut geprüft und der erste
   Stufe-3-Teilmeilenstein abgegrenzt werden.
3. Für Stufe 3 sind ein eigener Branch, Draft-PR, technische Abnahme, reale Gerätetests und eine
   spätere separate Merge-Freigabe erforderlich.
4. Spätere Entscheidungen zu RHIA-PC, Integrationen, KI-Budget, Sprache und nativer App werden erst
   an ihrem im Masterplan definierten Freigabepunkt getroffen.

## Bekannte Fehler oder nicht blockierende Punkte

- Es sind keine offenen blockierenden Funktionsfehler aus Stufe 2 bekannt.
- Nach einem erfolgreichen Sicherungsimport aktualisiert sich die Gedächtnisoberfläche noch nicht
  sofort. Die Daten sind bereits korrekt und persistent in IndexedDB gespeichert und werden nach
  Neuladen der Seite sichtbar. Dieser UI-Aktualisierungspunkt trat auf Tablet und Handy auf und
  blockiert den bestandenen Sicherungs-/Wiederherstellungsablauf nicht.
- Eine installierte oder bereits geöffnete PWA kann nach einem Deployment vorübergehend den alten
  Build anzeigen. Vor einer Fehlerbewertung alle RHIA-Tabs und den Browser vollständig schließen
  und die Testseite erneut öffnen.
- Tablet- und Handybestände sind bis Stufe 5 bewusst getrennt. Fehlende automatische
  Gerätesynchronisation ist derzeit kein Fehler.
- Ältere Dateien wie `docs/PROJECT_STATUS.md`, `README.md`, frühere Chat-Backups und
  Stufenprotokolle können einen historischen Zwischenstand vor dem Abschluss von Stufe 2 zeigen.
  Sie sind keine aktive Projektübergabe. Für den aktuellen Stand gilt ausschließlich diese Datei.
- Die GitHub-Pages-Environment-Regel wurde für den früheren Stufe-2-Feature-Branch ergänzt. Dies
  beeinflusst die aktuelle Funktion von `main` nicht.

## Aktuelle Sperren

- Stufe 3 und alle späteren Stufen dürfen nicht begonnen werden.
- Keine Funktions-, Architektur- oder Datenmodelländerung ohne neue Freigabe.
- OpenAI API und andere externe KI bleiben technisch deaktiviert.
- API-Budget bleibt bei 0 Euro, bis Sir einen Kostenrahmen ausdrücklich freigibt.
- Keine Cloud- oder Mehrgerätesynchronisation.
- Keine Cloudflare Workers, Pages Functions, KV, Durable Objects oder Wrangler-Laufzeit.
- Keine Sprache, kein Wake-Word, kein Dauer-Mikrofonbetrieb und keine native Android-App.
- Keine Kalender-, Datei-, E-Mail-, Kontakt- oder anderen externen Integrationen.
- Keine externen Aktionen, Käufe, Buchungen oder Veröffentlichungen.
- Keine produktiven oder persönlichen Testdaten auf der öffentlichen Testseite.
- Das alte Repository `GGRLAK-04872/RHIA` darf nicht verändert werden.
- Kein Merge in `main` ohne separate ausdrückliche Freigabe von Sir.

## Nächster geplanter Schritt

Nach Freigabe von Stufe 3:

1. tatsächlichen GitHub-Stand, Repository-Regeln, Masterplan, diese Übergabe und CI lesend prüfen;
2. Ziel, Umfang, Risiken und realistische Dauer des ersten Stufe-3-Teilmeilensteins nennen;
3. einen getrennten Stufe-3-Feature-Branch vom dann aktuellen `main` anlegen;
4. ausschließlich den freigegebenen ersten Teilmeilenstein der Arbeitszentrale umsetzen;
5. vor jedem weiteren Teilmeilenstein am vorgesehenen Haltepunkt stoppen.

Bis zur Freigabe ist nur lesende Prüfung und Pflege des Zwei-Dateien-Übergabesystems zulässig.

## Benötigte Freigabe von Sir

Der nächste zulässige Entwicklungsbefehl lautet:

> Stufe 3 freigegeben. Prüfe zuerst `docs/RHIA_START_HERE.md`,
> `docs/RHIA_MASTER_AUFBAUPLAN_2.2.md`, die Repository-Regeln und den tatsächlichen Stand von
> `GGRLAK-04872/RHIA-2/main`. Nenne anschließend Ziel, Umfang, Risiken und realistische Dauer des
> ersten Teilmeilensteins von Stufe 3, bevor du Änderungen vornimmst. Das alte Repository `RHIA`
> bleibt unverändert.

Diese Freigabe erlaubt noch keinen Merge. Jeder Merge benötigt weiterhin eine separate
ausdrückliche Freigabe.

## Automatische Aktualisierungsregel

Diese Regel ist verbindlich:

1. Nach jedem abgeschlossenen Teilmeilenstein, Meilenstein, Merge oder jeder abgeschlossenen
   Entwicklungsstufe wird `docs/RHIA_START_HERE.md` aktualisiert.
2. Aktualisiert werden mindestens Datum, Repository/Commit, Version, abgeschlossene Arbeiten,
   Abnahmen, offene Punkte, Fehler, Sperren, nächster Schritt und benötigte Freigabe.
3. Kein Wechsel in einen neuen Arbeitschat ohne aktualisierte `docs/RHIA_START_HERE.md`.
4. Es wird keine neue Übergabedatei pro Stufe erstellt.
5. Es wird kein paralleler aktiver Masterplan erstellt.
6. Historische Dokumente dürfen erhalten bleiben, gehören aber nicht zum normalen Chatstart.
7. Ändert sich der grundsätzliche Projektplan, wird zusätzlich
   `docs/RHIA_MASTER_AUFBAUPLAN_2.2.md` nach ausdrücklicher Entscheidung von Sir aktualisiert.
8. Vor Abschluss eines Arbeitschats ist zu prüfen, ob der Repository-Stand und diese Datei
   übereinstimmen. Bei Abweichung wird zuerst diese Datei korrigiert.

## Startanweisung für neuen Chat

> Arbeite ausschließlich auf Basis des tatsächlichen Repository-Stands von
> `GGRLAK-04872/RHIA-2`. Öffne zuerst `docs/RHIA_START_HERE.md` und danach
> `docs/RHIA_MASTER_AUFBAUPLAN_2.2.md`. Prüfe anschließend lesend, ob `main`, Commit, PR-/CI-Stand
> und Sperren mit `RHIA_START_HERE.md` übereinstimmen. Melde jede Abweichung sofort. Wiederhole
> keine bereits bestandenen Tests ohne relevanten neuen Änderungsgrund. Verändere weder das alte
> Repository `RHIA` noch Sicherheits-, Datenschutz- oder Kostengrenzen. Stufe 3 bleibt gesperrt,
> bis Sir sie ausdrücklich freigibt. Nenne vor jedem längeren Arbeitsschritt eine realistische
> Dauer und stoppe an jedem dokumentierten Freigabepunkt.

Nach diesem Starttext muss der neue Chat sofort melden:

- aktueller Projektstand: Stufe 2 abgeschlossen;
- aktueller `main`: `16d1f47f409c7247da5f5bce717514a4f38332c3`;
- nächster möglicher Schritt: Stufe 3 erst nach Freigabe;
- verboten: jede Stufe-3-Implementierung, jeder Merge und jede Änderung am alten Repository ohne
  passenden Auftrag.
