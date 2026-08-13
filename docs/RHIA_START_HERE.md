# RHIA 2.0 – Start Here

> Diese Datei ist die einzige lebende Übergabe für neue RHIA-2-Arbeitschats. Zusammen mit
> `docs/RHIA_MASTER_AUFBAUPLAN_2.2.md` bildet sie das vollständige aktive Übergabesystem.

## Verbindlicher Stand

| Feld | Bestätigter Stand am 13.08.2026 |
|---|---|
| Repository | `GGRLAK-04872/RHIA-2` |
| Offizieller Branch | `main` |
| `main` | `c0dcf52ec7eeacd12b960ae6421634d5e00635b3` |
| Integrierter Betriebsstart | PR #8 am 13.08.2026 per Squash-Merge eingebaut |
| Produktstand | Version 0.4.1, aktive Stufe 4 |
| Datenquelle | ausschließlich lokale IndexedDB des jeweiligen Browsers |
| Schema / Sicherung | Dexie-Version 5 / `rhia-backup` Version 4 |
| OpenAI / Kosten | API deaktiviert / Budget 0 Euro |
| Hauptprüfung | CI #81 auf dem aktuellen `main` vollständig erfolgreich |
| Veröffentlichung | Pages #64 auf dem aktuellen `main` erfolgreich |
| Testseite | `https://ggrlak-04872.github.io/RHIA-2/` |
| Reale Abnahme | Betriebsstart-Schnelltest T01 bis T12 am 13.08.2026 bestanden |
| Nächster Schritt | diese Dokumentationsänderung prüfen; danach lokale Testdaten einzeln bereinigen |
| Merge-Sperre | kein weiterer Merge ohne ausdrückliche Freigabe von Sir |

Das alte Repository `GGRLAK-04872/RHIA` bleibt unverändert und darf nicht beschrieben werden.

Der Masterplan wurde beim Betriebsstart nicht verändert. Sein Git-Blob auf `main` ist weiterhin
`0a883199d02625e49e55afc563b1b60640e3d0da`. Neuere ausdrückliche Entscheidungen von Sir und der
tatsächlich geprüfte Repository-Stand werden gemäß der Rangfolge des Masterplans hier als
aktueller Stand dokumentiert. Daraus folgt keine automatische Freigabe einer weiteren Stufe.

## Sicherung vor dem Betriebsstart

Vor den Betriebsstart-Änderungen wurden drei getrennte, unveränderliche Git-Branchzeiger erstellt:

| Sicherung | Gesicherter Stand |
|---|---|
| `backup/2026-08-12-main` | `25c445668651ccd6077b5ffcfce66d839c4f151d` |
| `backup/2026-08-12-stufe-4-planung` | `d611baffd35f2ad125fcfb3edbf3226b6efae4b1` |
| `backup/2026-08-12-ui-shell` | `836cfff045c98aef9563521313c6f0c353b0edc7` |

Damit sind der damalige Hauptstand, die Planung und die bis dahin erarbeitete RHIA-Oberfläche
separat rückholbar. Es wurden keine Browserdaten oder Sicherungsexporte in Git geschrieben.

## Bestätigter Entwicklungsstand

- Stufe 0 – Neustartbasis: abgeschlossen, real abgenommen und in `main`.
- Stufe 1 – Local-first-Datenfundament: abgeschlossen, real abgenommen und in `main`.
- Stufe 2 – Gedächtnis v1: abgeschlossen, real abgenommen und in `main`.
- Stufe 3 – Arbeitszentrale: abgeschlossen, real abgenommen und in `main`.
- Die für den freigegebenen Betriebsstart verwendeten Stufe-4-Bausteine sind technisch in `main`
  integriert und der Betriebsstart wurde praktisch abgenommen.
- Daraus wird keine Freigabe für Stufe 5 oder eine andere zusätzliche Entwicklungsstufe abgeleitet.

Die älteren Draft-PRs #6 und #7 sind weiterhin offen und ungemergt. Der bestätigte Betriebsstart
liegt bereits über PR #8 in `main`. Deshalb dürfen #6 und #7 nicht ohne eine eigene Prüfung und
ausdrückliche Entscheidung von Sir zusätzlich gemergt werden.

## Was RHIA jetzt wirklich kann

Der von Sir freigegebene Betriebsstart ist auf `main` enthalten:

- Start in der Übersicht als Firmen-Cockpit mit nächstem sinnvollem Schritt, Geldwirkung,
  Blockaden, offenen Entscheidungen und Projekten;
- bestätigte Schnelleingabe auf Basis der vorhandenen Aufgaben- und Prioritätsregeln;
- automatische, idempotente Speicherung des ersten RH-Produktionstags als bestätigter lokaler
  Gedächtnisfakt mit Jahrestag 12. August;
- emotionale sichtbare Begrüßung beim Öffnen am Jahrestag und optionales Vorlesen nach Klick;
- einmalige deutsche Browser-Spracherkennung nach sichtbarer Einwilligung;
- lokale Navigationsbefehle und Aufgabenentwurf, der weiterhin Sirs Bestätigung benötigt;
- sichtbare Fehler statt eines heimlichen Ersatzdienstes;
- responsive Mikrofontaste auf Desktop, Tablet und Handy;
- vollständige Textbedienung, auch wenn die Browser-Spracherkennung nicht verfügbar ist.

Die Browser-Spracherkennung kann Sprache an den Anbieter des Browsers übertragen. RHIA speichert
weder Audio noch Transkripte. Die Mikrofontaste ist kein Wake-Word und hört nicht dauerhaft zu.

## Unveränderte technische Grenzen

- Kein neues Datenbankschema und kein neues Sicherungsformat.
- Keine neue npm-Laufzeitabhängigkeit durch den Betriebsstart.
- Keine OpenAI API, keine externe KI und keine laufenden Kosten.
- Keine Cloud- oder Mehrgerätesynchronisation.
- Keine Kalender-, Datei-, E-Mail- oder Kontaktintegration.
- Keine externen Aktionen, Käufe, Buchungen oder Veröffentlichungen.
- Kein Dauerhören, kein Hintergrundmikrofon und kein Wake-Word.
- Wake-Word `Rhia`, lokale VAD/STT/TTS und Android-Hülle bleiben einer späteren, gesondert
  freizugebenden Stufe vorbehalten.
- Keine realen oder persönlichen Daten auf der öffentlichen Testseite.
- Keine Stufe 5 und kein neuer Funktionsumfang ohne ausdrückliche Freigabe von Sir.

## Technische und praktische Nachweise

| Prüfung | Ergebnis |
|---|---|
| Lokale Unit-/Komponententests vor dem Merge | 111/111 erfolgreich |
| Vollständiger lokaler `pnpm check` vor dem Merge | Format, Lint, TypeScript, Tests, Build und Audits erfolgreich |
| GitHub-CI nach dem Merge | CI #81 auf `c0dcf52ec7eeacd12b960ae6421634d5e00635b3` vollständig erfolgreich |
| Browser-Smoke | im erfolgreichen CI-Hauptlauf enthalten |
| Pages nach dem Merge | Pages #64 auf demselben `main`-Stand erfolgreich |
| Veröffentlichung | Deployment #5884011461 erfolgreich unter `https://ggrlak-04872.github.io/RHIA-2/` |
| Reale Abnahme durch Sir | Betriebsstart-Schnelltest T01 bis T12 bestanden |
| Gesamtergebnis Betriebsstart | freigegebenes Ziel erfüllt |

## Bekannte lokale Testdaten

Der Praxistest wurde mit künstlichen Daten durchgeführt. Je nach verwendetem Browser können noch
einzelne lokale Testeinträge vorhanden sein, insbesondere:

- `Testangebot für Musterkunde vorbereiten`;
- `Testrechnung prüfen`;
- `Texttest ohne Mikrofon`.

Diese Daten liegen nicht im Repository, sondern nur in der IndexedDB des jeweiligen Browsers. Sie
werden nicht automatisch oder vollständig gelöscht. Nach Freigabe dieses Dokumentationsstands ist
der nächste notwendige Arbeitsschritt, die vorhandenen Testeinträge gemeinsam mit Sir einzeln zu
prüfen und gezielt zu entfernen. Eine Gesamtlöschung erfolgt nur nach eigener ausdrücklicher
Bestätigung.

## Nächster erlaubter Ablauf

1. Diesen reinen Dokumentations-PR prüfen; ohne ausdrückliche Freigabe nicht mergen.
2. Danach die lokalen künstlichen Testdaten auf dem tatsächlich verwendeten Gerät gezielt
   bereinigen und den normalen Start erneut kontrollieren.
3. Erst anschließend den maximal sinnvollen weiteren lokalen Ausbau innerhalb des Masterplans
   analysieren und in klar getrennte, freigabepflichtige Schritte gliedern.
4. Keine Stufe 5, externe KI, Cloud-Synchronisation, Integration oder Wake-Word-Arbeit beginnen,
   bevor Sir die dafür notwendige neue Freigabe ausdrücklich erteilt hat.

## Dauerhafte Zwei-Dateien-Regel

Ein neuer RHIA-Arbeitschat liest zuerst diese Datei und danach
`docs/RHIA_MASTER_AUFBAUPLAN_2.2.md`, prüft lesend den tatsächlichen GitHub-, PR-, CI- und
Pages-Stand und meldet Abweichungen. Historische Statusdateien und alte Chats überschreiben diese
beiden aktiven Dateien nicht.

Ein neuer Chat verändert weder `main`, den Masterplan, offene Draft-PRs noch das alte Repository
ohne passenden Auftrag. Er beginnt keine neue Entwicklungsstufe aus dem Plantext heraus, sondern
wartet auf Sirs ausdrückliche Freigabe.
