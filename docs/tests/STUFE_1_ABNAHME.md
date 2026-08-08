# Abnahmeprotokoll – Stufe 1

Stand: 08.08.2026

Stufe 1 ist implementiert und technisch geprüft. Der abschließende reale Geräte-Praxistest durch
Sir steht noch aus. Bis zu dessen Bestätigung bleibt Stufe 1 offen und Stufe 2 gesperrt.

## Automatisierte Prüfung

| Prüfung | Erwartung |
|---|---|
| Zod-Verträge | `Area`, `Source`, `Note` und `AuditEntry` werden validiert |
| UUID und Metadaten | ID, Revision, Schema-Version und Zeitstempel sind vorhanden |
| CRUD | Erstellen, Lesen, Korrigieren und kontrolliertes Löschen funktionieren |
| Revisionsschutz | veraltete Änderungen werden abgelehnt |
| Transaktionen | künstlicher Fehler rollt alle beteiligten Tabellen zurück |
| Browser-Neustart | Daten bleiben nach Schließen und erneutem Öffnen erhalten |
| Migration | künstliche Version-1-Daten werden vollständig in Version 2 übernommen |
| Export | vollständiges, versioniertes JSON-Paket mit SHA-256 entsteht |
| Import | gültige Sicherung wird wiederhergestellt; Manipulation wird abgelehnt |
| Konflikte | vorhandene IDs blockieren einen stillen Import |
| Papierkorb | Löschen, Neuladen und Wiederherstellen ohne Wiederbelebung funktionieren |
| Gesamtlöschung | ohne exakte Bestätigung gesperrt; nach Bestätigung vollständig |
| Responsive Browser | Playwright auf Tablet, Handy und Desktop |
| Sicherheitsgrenze | keine externe API, kein Cloud-Fallback, keine Secrets im Build |

## Praxistest durch Sir

Nur künstliche Testdaten verwenden. Testdauer: ungefähr 20–40 Minuten.

1. Die RHIA-2-Testadresse auf dem Tablet öffnen.
2. Unter `Notizen testen` Bereich `RHIA Test`, Titel `Bordeaux 47` und einen künstlichen Inhalt
   eingeben; `Lokal speichern` wählen.
3. `Bearbeiten` wählen, den Titel in `Bordeaux 47 geändert` ändern und `Änderung speichern` wählen.
4. Seite schließen, erneut öffnen und prüfen, dass `Bordeaux 47 geändert` noch vorhanden ist.
5. `Löschen` wählen, Seite neu laden und prüfen, dass die Notiz ausschließlich im
   30-Tage-Papierkorb erscheint.
6. `Wiederherstellen` wählen, neu laden und prüfen, dass die Notiz wieder aktiv ist.
7. Unter `Sicherung und Löschung` eine Sicherung exportieren.
8. Eine sichtbar veränderte oder fremde JSON-Datei darf nicht importiert werden.
9. Die vollständige Löschung erst mit der angezeigten exakten Bestätigungsphrase freigeben.
10. Seite neu laden und prüfen, dass keine Notiz wieder erscheint.
11. Die Schritte 1–6 auf dem Handy wiederholen und Hoch-/Querformat prüfen.

## Abschluss

- [ ] vollständiger lokaler und GitHub-CI-Prüflauf grün
- [ ] Stufe-1-Testbuild unter der getrennten RHIA-2-Adresse bereitgestellt
- [ ] Tablet-Test bestanden
- [ ] Handy-Test bestanden
- [ ] Sir bestätigt Stufe 1 ausdrücklich

Erst danach darf Stufe 2 – Gedächtnis v1 beginnen.
