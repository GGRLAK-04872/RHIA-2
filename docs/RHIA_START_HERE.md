# RHIA 2.0 – Start Here

> Diese Datei ist die einzige lebende Übergabe für neue RHIA-2-Arbeitschats. Zusammen mit
> `docs/RHIA_MASTER_AUFBAUPLAN_2.2.md` bildet sie das vollständige aktive Übergabesystem.

## Aktueller Projektstand

| Feld | Verbindlicher Stand |
|---|---|
| Datum | 09.08.2026 |
| Repository | `GGRLAK-04872/RHIA-2` |
| Verbindlicher Branch | `main` |
| Letzter verifizierter Funktionsstand auf `main` | `16d1f47f409c7247da5f5bce717514a4f38332c3` |
| Produktversion | `0.2.0` |
| Aktive Stufe im Produkt | `2` |
| Freigegebene Entwicklungsstufe | `3` |
| Vorbereiteter Teilmeilenstein | `3.1 – Domänenmodell und Verträge der Arbeitszentrale` |
| Datenbankschema | Dexie-Version 3 |
| Sicherungsformat | `rhia-backup` Version 2 |
| Testseite | <https://ggrlak-04872.github.io/RHIA-2/> |
| Aktive Datenquelle | lokale IndexedDB des jeweiligen Browsers |
| Projektphase | Stufe 3 freigegeben; Teilmeilenstein 3.1 vorbereitet; noch keine Stufe-3-Funktionalität implementiert |
| Dokumentationsstand | Stufe-3-Freigabe und Teilmeilenstein 3.1 über PR #4 dokumentiert; keine Funktionsänderung |

Der Commit `16d1f47f409c7247da5f5bce717514a4f38332c3` bezeichnet den letzten technisch geprüften
Funktionsstand von RHIA 2.0 auf `main`. Spätere reine Dokumentationsänderungen oder
Übergabe-Commits verändern diesen Funktionsstand nicht. Sie gehören zum Dokumentationsstand. Ein
neuer Chat muss prüfen, ob der Funktionscommit in der Historie des aktuellen `main` enthalten ist,
welche späteren Commits hinzugekommen sind und ob spätere Funktionsänderungen vollständig in dieser
Datei dokumentiert wurden. PR #3 ist geschlossen und gemergt. Das alte Repository
`GGRLAK-04872/RHIA` bleibt unverändert und darf nicht beschrieben werden.

Die Freigabe von Stufe 3 ändert den verifizierten Funktionsstand nicht. Bis ein Stufe-3-Teilmeilenstein
implementiert, technisch geprüft, abgenommen und in `main` integriert wurde, bleibt der dokumentierte
Funktionsstand bei Produktversion `0.2.0` und Stufe 2.

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

**Stufe 3 wurde von Sir am 09.08.2026 freigegeben. Vorbereitet ist ausschließlich Teilmeilenstein
3.1 – Domänenmodell und Verträge der Arbeitszentrale.**

Es wurde noch keine Stufe-3-Funktionalität implementiert. Der bereits freigegebene erste
Teilmeilenstein umfasst ausschließlich:

- `Project`, `Goal`, `Task` und `TaskDependency` in `packages/domain`;
- Status- und Felddefinitionen, Erzeugungsfunktionen sowie Domänenregeln;
- strikte Zod-Verträge in `packages/contracts`;
- automatisierte Domänen- und Vertragstests.

Nicht Bestandteil von Teilmeilenstein 3.1 sind Dexie-Migration, Speicherung, Repositories,
Prioritätsalgorithmus, Benutzeroberfläche, Export/Import-Erweiterung oder weitere
Stufe-3-Teilmeilensteine. Der bestehende Datenweg
`UI -> Anwendungsdienst -> Domäne -> Repository -> IndexedDB` bleibt unverändert.

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

1. Vor der Implementierung von Teilmeilenstein 3.1 müssen der tatsächliche `main`-Stand, die
   Repository-Regeln und der aktuelle CI-Stand erneut geprüft werden.
2. Teilmeilenstein 3.1 erhält einen eigenen Feature-Branch und Draft-PR.
3. Vor Teilmeilenstein 3.2 wird gestoppt; dafür ist eine neue ausdrückliche Freigabe erforderlich.
4. Jeder Merge in `main` benötigt weiterhin eine separate ausdrückliche Freigabe von Sir.
5. Spätere Entscheidungen zu RHIA-PC, Integrationen, KI-Budget, Sprache und nativer App werden erst
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

- Freigegeben ist ausschließlich Stufe 3.1; Stufe 3.2 und alle späteren Teilmeilensteine oder Stufen
  bleiben gesperrt.
- In Stufe 3.1 sind nur Änderungen an Domänenmodell, Verträgen und zugehörigen Tests zulässig.
- Keine Dexie-Migration, Speicherung, Repositories, Prioritätslogik, UI- oder
  Export/Import-Erweiterung innerhalb von Stufe 3.1.
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

1. tatsächlichen `main`-Stand, Repository-Regeln, Masterplan, diese Übergabe und CI lesend prüfen;
2. einen getrennten Stufe-3.1-Feature-Branch vom dann aktuellen `main` anlegen;
3. ausschließlich Domänenmodell, Verträge und zugehörige Tests für `Project`, `Goal`, `Task` und
   `TaskDependency` umsetzen;
4. die relevanten Qualitätsprüfungen ausführen und einen Draft-PR erstellen;
5. vor Dexie-Migration, Speicherung, Priorisierung, UI und Teilmeilenstein 3.2 stoppen.

## Benötigte Freigabe von Sir

Für den Beginn von Teilmeilenstein 3.1 ist keine weitere Stufenfreigabe erforderlich. Der nächste
zulässige Entwicklungsbefehl lautet:

> Setze ausschließlich Stufe 3.1 – Domänenmodell und Verträge der Arbeitszentrale – auf einem
> getrennten Feature-Branch vom aktuellen `main` um. Prüfe vorher Repository-Regeln, CI und den
> tatsächlichen `main`-Stand. Ändere nur `packages/domain`, `packages/contracts` und zugehörige
> Tests. Keine Dexie-Migration, Speicherung, Priorisierung, UI oder Export/Import-Erweiterung. Das
> alte Repository `RHIA` bleibt unverändert. Stoppe vor Stufe 3.2 und vor jedem Merge.

Die Stufe-3-Freigabe erlaubt keinen Merge. Jeder Merge benötigt weiterhin eine separate
ausdrückliche Freigabe.

## Dauerhafte Zwei-Dateien-Chatwechsel-Regel

Die Zwei-Dateien-Struktur ist verbindlicher Projektstandard. Bei jedem neuen Arbeitschat werden
ausschließlich diese beiden Dateien als aktive Übergabe verwendet:

- `docs/RHIA_MASTER_AUFBAUPLAN_2.2.md`;
- `docs/RHIA_START_HERE.md`.

Ein neuer Chat:

- prüft den tatsächlichen Repository-Stand;
- prüft die Konsistenz der beiden Dateien;
- bestimmt den erlaubten nächsten Schritt;
- erstellt kein neues Übergabesystem;
- fordert keine alten Chatprotokolle, alten Masterversionen oder historischen Dokumente an,
  solange diese beiden Dateien vorhanden und konsistent sind.

Der neue Chat unterscheidet dabei verbindlich zwischen:

- **Funktionsstand:** letzter technisch geprüfter Entwicklungsstand;
- **Dokumentationsstand:** spätere Änderungen an Übergabe- oder Planungsdateien.

Falls eine Unstimmigkeit gefunden wird:

1. Problem melden.
2. Ursache nennen.
3. Nur die betroffene Übergabedatei korrigieren.

Bei einem normalen Chatwechsel erfolgt keine erneute Grundsatzprüfung des Zwei-Dateien-Systems.

## Automatische Aktualisierungsregel

Diese Regel ist verbindlich:

1. Nach jedem abgeschlossenen Teilmeilenstein, Meilenstein, Merge oder jeder abgeschlossenen
   Entwicklungsstufe wird `docs/RHIA_START_HERE.md` aktualisiert.
2. Aktualisiert werden mindestens Datum, letzter verifizierter Funktionsstand auf `main`, späterer
   Dokumentationsstand, Version, abgeschlossene Arbeiten, Abnahmen, offene Punkte, Fehler, Sperren,
   nächster Schritt und benötigte Freigabe.
3. Die Aktualisierung erfolgt immer vor Beginn der nächsten Entwicklungsstufe.
4. Kein Wechsel in einen neuen Arbeitschat ohne aktualisierte `docs/RHIA_START_HERE.md`.
5. Es wird keine neue Übergabedatei pro Stufe erstellt.
6. Es wird kein paralleler aktiver Masterplan erstellt.
7. Historische Dokumente dürfen erhalten bleiben, gehören aber nicht zum normalen Chatstart.
8. Ändert sich der grundsätzliche Projektplan, wird zusätzlich
   `docs/RHIA_MASTER_AUFBAUPLAN_2.2.md` nach ausdrücklicher Entscheidung von Sir aktualisiert.
9. Vor Abschluss eines Arbeitschats ist zu prüfen, ob der Repository-Stand und diese Datei
   übereinstimmen. Bei einer Abweichung werden Problem und Ursache gemeldet und nur die betroffene
   Übergabedatei korrigiert.

## Startanweisung für neuen Chat

> Arbeite ausschließlich auf Basis des tatsächlichen Repository-Stands von
> `GGRLAK-04872/RHIA-2`. Öffne zuerst `docs/RHIA_START_HERE.md` und danach
> `docs/RHIA_MASTER_AUFBAUPLAN_2.2.md`. Prüfe anschließend lesend den aktuellen `main`, den letzten
> verifizierten Funktionsstand, alle späteren Commits, den PR-/CI-Stand und die Sperren. Stelle sicher,
> dass spätere Funktionsänderungen vollständig in `RHIA_START_HERE.md` dokumentiert sind; reine
> Übergabe-Dokumentationscommits dürfen nach dem Funktionscommit liegen. Melde jede Abweichung
> sofort. Wiederhole keine bereits bestandenen Tests ohne relevanten neuen Änderungsgrund. Fordere
> keine alten Chatprotokolle, alten Masterversionen oder historischen Dokumente an, solange die
> beiden aktiven Dateien vorhanden und konsistent sind. Verändere weder das alte Repository `RHIA`
> noch Sicherheits-, Datenschutz- oder Kostengrenzen. Stufe 3.1 ist freigegeben; alle späteren
> Teilmeilensteine und Stufen bleiben gesperrt. Nenne vor jedem längeren Arbeitsschritt eine
> realistische Dauer und stoppe an jedem dokumentierten Freigabepunkt.

Nach diesem Starttext muss der neue Chat sofort melden:

- aktueller Projektstand: Stufe 2 abgeschlossen;
- letzter verifizierter Funktionsstand auf `main`:
  `16d1f47f409c7247da5f5bce717514a4f38332c3`;
- Dokumentationsstand: gegebenenfalls spätere reine Übergabe- oder Planungscommits;
- nächster erlaubter Schritt: Stufe 3.1 auf einem getrennten Feature-Branch beginnen;
- verboten: Stufe 3.2 oder spätere Stufen, jeder Merge sowie jede Änderung am alten Repository
  ohne passenden Auftrag.
