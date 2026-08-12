# RHIA 2.0 – Start Here

> Diese Datei ist die einzige lebende Übergabe für neue RHIA-2-Arbeitschats. Zusammen mit
> `docs/RHIA_MASTER_AUFBAUPLAN_2.2.md` bildet sie das vollständige aktive Übergabesystem.

## Verbindlicher Stand

| Feld | Stand am 12.08.2026 |
|---|---|
| Repository | `GGRLAK-04872/RHIA-2` |
| Aktiver Betriebsstart-Branch | `agent/rhia-firmenassistent-test` |
| Basis des Betriebsstarts | `agent/stufe-4-ui-shell` auf `836cfff045c98aef9563521313c6f0c353b0edc7` |
| `main` | `25c445668651ccd6077b5ffcfce66d839c4f151d`; unverändert |
| Stufe-4-Planung | Draft-PR #6, Head `d611baffd35f2ad125fcfb3edbf3226b6efae4b1`, ungemergt |
| Stufe-4-UI | Draft-PR #7, Head `836cfff045c98aef9563521313c6f0c353b0edc7`, ungemergt |
| Betriebsstart-Draft | `[nach Veröffentlichung eintragen]` |
| Produktstand | Version 0.4.1, aktive Stufe 4 |
| Datenquelle | ausschließlich lokale IndexedDB des jeweiligen Browsers |
| Schema / Sicherung | Dexie-Version 5 / `rhia-backup` Version 4 |
| OpenAI / Kosten | API deaktiviert / Budget 0 Euro |
| Nächster Schritt | CI und Preview prüfen; danach Praxisschnelltest durch Sir |
| Merge | nicht freigegeben; Stufe 5 bleibt gesperrt |

Das alte Repository `GGRLAK-04872/RHIA` bleibt unverändert und darf nicht beschrieben werden.

## Verifizierte Sicherung vor dem Betriebsstart

Vor jeder Betriebsstart-Änderung wurden drei getrennte, unveränderliche Git-Branchzeiger erstellt:

| Sicherung | Gesicherter Stand |
|---|---|
| `backup/2026-08-12-main` | `25c445668651ccd6077b5ffcfce66d839c4f151d` |
| `backup/2026-08-12-stufe-4-planung` | `d611baffd35f2ad125fcfb3edbf3226b6efae4b1` |
| `backup/2026-08-12-ui-shell` | `836cfff045c98aef9563521313c6f0c353b0edc7` |

Damit sind veröffentlichter Hauptstand, Planung und die bis dahin erarbeitete RHIA-Oberfläche
separat rückholbar. Es wurden keine Browserdaten oder Sicherungsexporte in Git geschrieben.

## Abgeschlossene Stufen

- Stufe 0 – Neustartbasis: abgeschlossen, real abgenommen und in `main`.
- Stufe 1 – Local-first-Datenfundament: abgeschlossen, real abgenommen und in `main`.
- Stufe 2 – Gedächtnis v1: abgeschlossen, real abgenommen und in `main`.
- Stufe 3 – Arbeitszentrale: abgeschlossen, real abgenommen und über PR #5 in `main`.
- Stufe 4 – Planung und Briefings: technisch umgesetzt; Schnellabnahme weiterhin offen.
- Stufe 4 – kompakte UI: technisch umgesetzt; Draft-PR #7 und erneute Sichtabnahme offen.

## Freigegebener RHIA-Betriebsstart

Sir hat am 12.08.2026 entschieden:

> Betriebsstart zuerst: Cockpit, Erinnerung und Mikrofontaste; echtes Wake-Word anschließend.

Auf dem getrennten Branch ist deshalb umgesetzt:

- Start in der Übersicht als Firmen-Cockpit mit nächstem sinnvollem Schritt, Geldwirkung,
  Blockaden, offenen Entscheidungen und Projekten;
- bestätigte Schnelleingabe auf Basis der vorhandenen Stufe-3-Regeln;
- automatische, idempotente Speicherung des ersten RH-Produktionstags als bestätigter
  `MemoryFact` mit Jahrestag 12. August;
- emotionale sichtbare Begrüßung beim Öffnen am Jahrestag und optionales Vorlesen nach Klick;
- einmalige deutsche Browser-Spracherkennung nach sichtbarer Einwilligung;
- lokale Navigationsbefehle und Aufgabenentwurf, der weiterhin Sirs Bestätigung benötigt;
- sichtbare Fehler statt eines heimlichen Ersatzdienstes;
- responsive Mikrofontaste auf Desktop, Tablet und Handy.

Die Browser-Spracherkennung kann Sprache an den Anbieter des Browsers übertragen. RHIA speichert
weder Audio noch Transkripte. Die Textbedienung bleibt ohne Mikrofon vollständig erhalten.

## Unveränderte technische Grenzen

- Kein neues Datenbankschema und kein neues Sicherungsformat.
- Keine neue npm-Laufzeitabhängigkeit.
- Keine OpenAI API, keine externe KI und keine laufenden Kosten.
- Keine Cloud- oder Mehrgerätesynchronisation.
- Keine Kalender-, Datei-, E-Mail- oder Kontaktintegration.
- Keine externen Aktionen, Käufe, Buchungen oder Veröffentlichungen.
- Kein Dauerhören, kein Hintergrundmikrofon und kein Wake-Word.
- Wake-Word `Rhia`, lokale VAD/STT/TTS und Android-Hülle bleiben Stufe 9.
- Keine realen oder persönlichen Daten auf der öffentlichen Testseite.
- Kein Merge nach `main` ohne weitere ausdrückliche Freigabe von Sir.

## Technische Nachweise

| Prüfung | Ergebnis |
|---|---|
| Lokale Unit-/Komponententests | 111/111 grün |
| Vollständiger `pnpm check` | Format, Lint, TypeScript, Tests, Build und alle Audits erfolgreich |
| Lokaler Playwright-Lauf | Chromium in der Work-Umgebung nicht vorhanden; GitHub-CI übernimmt |
| GitHub-CI | `[nach Veröffentlichung eintragen]` |
| Pages-/PR-Preview | `[nach Veröffentlichung eintragen]` |
| Reale Abnahme | offen; `docs/tests/RHIA_BETRIEBSSTART_SCHNELLTEST.md` |

## Restdauer bis Sirs finalem Schnelltest

Nach grünem lokalen Prüflauf werden für Draft-PR, GitHub-CI und Preview erfahrungsgemäß etwa 10 bis
20 Minuten benötigt. Sirs eigener Praxisschnelltest dauert ungefähr 15 bis 25 Minuten. Insgesamt
sind ab technischer Übergabe etwa 25 bis 45 Minuten bis zu Sirs Ergebnis einzuplanen. Falls der
verwendete Browser keine Spracherkennung unterstützt oder die Berechtigung blockiert, verlängert
sich die Geräteklärung; dieser Fall wird nicht als bestanden ausgegeben.

## Nächster erlaubter Schritt

1. Vollständigen lokalen Prüflauf abschließen.
2. Betriebsstart ausschließlich auf `agent/rhia-firmenassistent-test` veröffentlichen.
3. Draft-PR gegen `agent/stufe-4-ui-shell` erstellen; nichts mergen.
4. CI und Preview auf demselben Branch-Head prüfen.
5. Sir führt `docs/tests/RHIA_BETRIEBSSTART_SCHNELLTEST.md` mit künstlichen Daten durch.
6. Danach stoppen und Sirs Ergebnis beziehungsweise gesonderte Mergeentscheidung abwarten.

## Dauerhafte Zwei-Dateien-Regel

Ein neuer RHIA-Arbeitschat liest zuerst diese Datei und danach
`docs/RHIA_MASTER_AUFBAUPLAN_2.2.md`, prüft lesend den tatsächlichen GitHub-, PR-, CI- und
Pages-Stand und meldet Abweichungen. Historische Statusdateien und alte Chats überschreiben diese
beiden aktiven Dateien nicht.

Ein neuer Chat darf weder Stufe 5 beginnen noch `main`, PR #6, PR #7 oder das alte Repository
verändern. Nach grünem Betriebsstart-Preview begleitet er Sir nur durch den dokumentierten
Praxisschnelltest, bis Sir eine neue ausdrückliche Freigabe erteilt.
