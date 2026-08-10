# RHIA 2.0 – Start Here

> Diese Datei ist die einzige lebende Übergabe für neue RHIA-2-Arbeitschats. Zusammen mit
> docs/RHIA_MASTER_AUFBAUPLAN_2.2.md bildet sie das vollständige aktive Übergabesystem.

## Aktueller Projektstand

| Feld | Verbindlicher Stand |
|---|---|
| Datum | 10.08.2026 |
| Repository | GGRLAK-04872/RHIA-2 |
| Verbindlicher Branch | main |
| Letzter verifizierter Funktionsstand auf main | 4e86426870e7eba7e309a365a986be5a3a3e6a6e |
| Produktversion | 0.3.0 |
| Aktive Stufe im Produkt | 3 |
| Abgeschlossene Entwicklungsstufen | 0, 1, 2 und 3 |
| Nächste Entwicklungsstufe | Stufe 4 – gesperrt |
| Datenbankschema | Dexie-Version 4 |
| Sicherungsformat | rhia-backup Version 3 |
| Testseite | https://ggrlak-04872.github.io/RHIA-2/ |
| Aktive Datenquelle | lokale IndexedDB des jeweiligen Browsers |
| Projektphase | Stufe 3 vollständig abgeschlossen; Warten auf separate Freigabe für Stufe 4 |
| Offene Abnahmefehler | keine |

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
  die Seite neu öffnen.

## Aktueller Haltepunkt

Stufe 3 ist abgeschlossen. Es gibt keine Freigabe für Stufe 4.

Bis zu einer neuen ausdrücklichen Freigabe von Sir sind nur lesende Prüfungen des bestehenden
Stands zulässig. Es darf kein Stufe-4-Branch angelegt, keine Stufe-4-Implementierung begonnen und
kein weiterer Entwicklungs-PR erstellt oder gemergt werden.

## Aktuelle Sperren

- Stufe 4 und alle späteren Stufen bleiben gesperrt.
- OpenAI API und andere externe KI bleiben technisch deaktiviert.
- Das API-Budget bleibt bei 0 Euro, bis Sir einen Kostenrahmen ausdrücklich freigibt.
- Keine Cloud- oder Mehrgerätesynchronisation vor der dafür vorgesehenen Stufe.
- Keine Cloudflare-Laufzeit, keine Sprache, kein Wake-Word und keine native Android-App.
- Keine Kalender-, Datei-, E-Mail-, Kontakt- oder anderen externen Integrationen.
- Keine externen Aktionen, Käufe, Buchungen oder Veröffentlichungen.
- Keine produktiven oder persönlichen Testdaten auf der öffentlichen Testseite.
- Das alte Repository GGRLAK-04872/RHIA darf nicht verändert werden.
- Keine weiteren Arbeiten ohne ausdrückliche Freigabe von Sir.

## Nächster erlaubter Schritt

Auf eine separate ausdrückliche Freigabe für die Vorbereitung von Stufe 4 warten. Eine spätere
Freigabe muss zuerst den tatsächlichen main-, CI-, Pages- und Übergabestand prüfen und den Umfang
von Stufe 4 aus dem Masterplan verbindlich abgrenzen. Der Abschluss von Stufe 3 erteilt keine
automatische Freigabe.

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
> Stufe 4 ist nicht freigegeben. Verändere weder das alte Repository RHIA noch Sicherheits-,
> Datenschutz- oder Kostengrenzen. Nenne vor jedem längeren Arbeitsschritt eine realistische
> Dauer und stoppe an jedem Freigabepunkt.

Ein neuer Chat muss sofort melden:

- Stufen 0 bis 3 abgeschlossen;
- Produktversion 0.3.0 und aktive Stufe 3;
- letzter verifizierter Funktionsstand auf main:
  4e86426870e7eba7e309a365a986be5a3a3e6a6e;
- Stufe 3.9 auf Tablet und Handy bestanden, keine offenen Abnahmefehler;
- nächster erlaubter Schritt: auf ausdrückliche Freigabe für Stufe 4 warten;
- verboten: jede Stufe-4-Arbeit oder Änderung am alten Repository ohne passenden Auftrag.
