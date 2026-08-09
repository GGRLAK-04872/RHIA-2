# Abnahmeprotokoll – Stufe 2 Gedächtnis v1

Stand: 09.08.2026

Teilmeilenstein 2.9 wurde am 09.08.2026 ausdrücklich freigegeben. Dieses Protokoll trennt den
bereits grünen technischen Ausgangsstand von den noch offenen Prüfungen des finalen
Stufe-2-Commits, der Preview und der realen Geräteabnahme. Bis alle offenen Tore bestanden und von
Sir bestätigt sind, bleibt Stufe 2 unabgeschlossen, Draft-PR #3 ungemergt und Stufe 3 gesperrt.

## Sicherheits- und Testgrenzen

- ausschließlich die getrennte RHIA-2-Testadresse verwenden;
- nur die unten genannten künstlichen Testdaten eingeben;
- keine persönlichen Daten, Secrets, echten Sicherungen oder produktiven Dateien verwenden;
- OpenAI, Cloud-Sync, externe Aktionen und laufende API-Kosten bleiben deaktiviert;
- die Daten jedes Browsers bleiben lokal und erscheinen nicht automatisch auf einem anderen Gerät;
- `GGRLAK-04872/RHIA` und `main` bleiben unverändert;
- kein Merge ohne eine spätere ausdrückliche Freigabe durch Sir.

## Automatisierte technische Tore

| Prüfung | Erwartung | Stand |
|---|---|---|
| Ausgangs-CI | CI #20 auf `5bbc2f44…`: Qualität/Build und 12 Browser-/Responsive-Smokes | bestanden |
| vollständiger lokaler Prüflauf | Format/Lint, TypeScript, 50 Vitest-Tests, Build und Audits | bestanden |
| Stufe-2-CI | Qualität/Build und Browser-Smoke auf dem finalen 2.9-Commit | offen bis zum Upload |
| Browsergrößen | Handy, Tablet, Desktop sowie Hoch- und Querformat ohne horizontalen Überlauf | offen bis zur Stufe-2-CI |
| Preview | geprüfter 2.9-Commit unter der getrennten RHIA-2-Testadresse | offen bis zum Upload |
| öffentlicher Build | keine Secrets, internen Dateien oder Cloud-Abhängigkeiten | offen bis zur Stufe-2-CI |
| altes Repository | `GGRLAK-04872/RHIA` bleibt unverändert | abschließend zu kontrollieren |

## Künstliche Testdaten

Für beide Geräte ausschließlich diese Werte verwenden. Auf dem zweiten Gerät kann hinter
`Bordeaux` die Zahl `57` statt `47` verwendet werden, damit die beiden lokalen Browserbestände
leicht unterscheidbar bleiben.

| Feld | Wert |
|---|---|
| Wissensart | `test` |
| Subjekt | `sir` |
| Eigenschaft | `testcode` |
| Konfliktschlüssel | `sir.testcode` |
| erster Wert | `Bordeaux 47` |
| erste Anzeige | `Der künstliche Testcode ist Bordeaux 47.` |
| korrigierter Wert | `Bordeaux 48` |
| korrigierte Anzeige | `Der künstliche Testcode ist Bordeaux 48.` |
| widersprüchlicher Wert | `Bordeaux 99` |
| widersprüchliche Anzeige | `Der künstliche Testcode ist Bordeaux 99.` |
| Entscheidungstitel | `Künstlicher Stufe-2-Test` |
| Entscheidung | `Für diesen Test gilt ausschließlich Bordeaux 48.` |
| Begründung | `Damit werden Entscheidung und Begründung ohne persönliche Daten geprüft.` |

## Realer Praxistest auf dem Tablet

Geschätzte Dauer: ungefähr 15–25 Minuten.

1. Die getrennte RHIA-2-Testadresse öffnen und unter `Fakten und Entscheidungen` den Zustand
   `Bereit` prüfen.
2. Falls dort alte künstliche Testdaten liegen: `Sicherung und Löschung` öffnen, die angezeigte
   Bestätigungsphrase eingeben, alle lokalen Daten löschen und die Seite neu laden.
3. Mit den vorgegebenen Testdaten einen Fakt als Vorschlag speichern. Prüfen, dass er zunächst den
   Status `Vorschlag` trägt, und ihn danach ausdrücklich bestätigen.
4. Browser vollständig schließen, erneut öffnen und nach `Bordeaux 47` suchen. Der bestätigte Fakt
   muss weiterhin vorhanden sein.
5. Den Fakt korrigieren, `Bordeaux 48` und die korrigierte Anzeige eintragen, die Korrektur
   vorschlagen und bestätigen. Die alte Fassung muss als `Frühere Fassung`, die neue als
   `Bestätigt` nachvollziehbar bleiben.
6. Einen zweiten Fakt mit demselben Konfliktschlüssel und `Bordeaux 99` vorschlagen und bestätigen.
   RHIA muss einen offenen Konflikt anzeigen und darf keinen Wert still überschreiben.
7. Im offenen Konflikt bewusst `Bordeaux 48` beibehalten. Danach darf kein offener Konflikt mehr
   angezeigt werden.
8. Den Eintragstyp `Entscheidung` wählen, Titel, Entscheidung und Begründung aus der Tabelle als
   Vorschlag speichern und ausdrücklich bestätigen.
9. Suche und Filter einzeln prüfen: Text `Bordeaux`, Typ `Fakten`, Status `Bestätigt`, Bereich,
   Quelle und Aktualität `Aktuell`. Jeder Treffer muss zur Auswahl passen.
10. Den aktiven Testfakt mit `Verwerfen` in den Papierkorb verschieben, die Seite neu laden und ihn
    mit `Als Vorschlag wiederherstellen` zurückholen. Er darf erst nach erneuter ausdrücklicher
    Bestätigung wieder aktiv sein.
11. Unter `Sicherung und Löschung` eine v2-Sicherung exportieren. Dieselbe Sicherung vor der
    Gesamtlöschung erneut prüfen: Vorhandene IDs müssen als Importkonflikte erscheinen und den
    Import blockieren.
12. Alle lokalen Daten mit der exakten Bestätigungsphrase löschen, Seite neu laden und prüfen, dass
    kein Testfakt und keine Testentscheidung wieder erscheint.
13. Die zuvor exportierte gültige v2-Sicherung prüfen und importieren. Nach dem Neuladen müssen
    Fakt, Entscheidung, frühere Fassung und Konfliktverlauf wieder vorhanden sein.
14. Handy- und Tabletansicht einmal im Hoch- und Querformat prüfen. Formulare und Aktionen müssen
    ohne horizontal abgeschnittene Bedienelemente nutzbar bleiben.

## Realer Praxistest auf dem Handy

Geschätzte Dauer: ungefähr 10–15 Minuten.

1. Die Testadresse zuerst ohne Import öffnen. Tablet-Testdaten dürfen nicht automatisch vorhanden
   sein; das bestätigt die lokale Gerätegrenze.
2. Schritte 2 bis 10 des Tablet-Tests mit `Bordeaux 57`, Korrektur `Bordeaux 58` und Widerspruch
   `Bordeaux 59` wiederholen.
3. Eine v2-Sicherung exportieren, den sofortigen Wiederimport wegen vorhandener IDs blockieren,
   anschließend vollständig löschen und die gültige Sicherung wieder importieren.
4. Browser schließen und neu öffnen; die wiederhergestellten Daten müssen erhalten bleiben.
5. Hoch- und Querformat prüfen. Es darf keinen horizontalen Überlauf und keine verdeckte
   Hauptaktion geben.

## Bestätigtes Praxisergebnis

Noch offen. Hier werden nach Sirs Rückmeldung Gerät, Ergebnis und Datum dokumentiert. Ein Fehler in
einem einzelnen Schritt stoppt die Abnahme; er wird vor einem Merge isoliert analysiert und
behoben.

## Abschluss

- [x] finaler lokaler 2.9-Prüflauf grün
- [ ] GitHub-CI auf dem 2.9-Commit vollständig grün
- [ ] Stufe-2-Preview mit dem geprüften Commit bereitgestellt
- [ ] Tablet-Test bestanden
- [ ] Handy-Test bestanden
- [ ] Sir bestätigt Stufe 2 ausdrücklich
- [ ] Branch, PR, Preview und Commit abschließend dokumentiert

Stufe 2 und Draft-PR #3 bleiben bis zur vollständigen technischen und realen Abnahme offen und
ungemergt. Stufe 3 darf nicht begonnen werden.
