# RHIA 2.0 – Projektstand

Stand: 09.08.2026

## Aktuelle Stufe

Stufe 1 – Local-first-Datenfundament ist vollständig abgeschlossen und von Sir am 09.08.2026 nach
bestandenem Tablet- und Handytest abgenommen. Draft-PR #1 bleibt bis zur gesonderten Einbaufreigabe
ungemergt; Stufe 2 ist noch nicht freigegeben.

## Umgesetzt

- verbindlicher RHIA-2.0-Masterplan;
- TypeScript-Monorepository mit React/Vite-PWA und gemeinsamen Paketen;
- strikt lokale App-Shell ohne Datenbank, Cloud-Laufzeit oder KI-Aufruf;
- sichtbare Fehlergrenze ohne versteckte Ersatzquelle;
- Unit-, Komponenten- und Browser-Smoke-Testbasis;
- CI, Secret-Scan und Audit des öffentlichen Builds;
- Altcode-Audit mit Übernahme- und Archivmatrix;
- ADRs für Architektur, Quelle der Wahrheit und Cloud-Abgrenzung.
- lokale Kernprüfung bestanden: 6 Tests, Build, PWA, HTTP-Smoke und 0 bekannte
  Produktionsabhängigkeitslücken.
- öffentlicher Codebestand ausschließlich in `GGRLAK-04872/RHIA-2` veröffentlicht;
- GitHub CI einschließlich Chromium-Browser-Smoke bestanden;
- getrennte GitHub-Pages-Testadresse erfolgreich bereitgestellt;
- Android-Praxistest durch Sir bestanden;
- OpenAI API weiterhin deaktiviert; keine API-Aufrufe oder API-Kosten;
- altes Repository `RHIA` unverändert.
- versionierte Basistypen und Zod-Verträge für `Area`, `Source`, `Note` und `AuditEntry`;
- Dexie-/IndexedDB-Repositories als einzige lokale Datenquelle;
- UUIDs, Revisionen, Zeitstempel und sichtbare Fehlercodes;
- CRUD, Cross-Table-Transaktionen und optimistischer Konfliktschutz;
- getestete Migration künstlicher Version-1-Altdaten;
- versionierter JSON-Export mit SHA-256 und validierter Importvorschau;
- Importkonflikte blockieren stilles Überschreiben;
- 30-Tage-Papierkorb, Wiederherstellung und bestätigte Gesamtlöschung;
- responsive lokale Notizansicht mit Sicherungs- und Löschfunktionen.
- realer Tablet- und Handytest einschließlich Bearbeiten, Neustartpersistenz, Papierkorb,
  Wiederherstellung, Export, Gesamtlöschung, gültigem Import und Ablehnung einer ungültigen
  Sicherung bestanden;
- Handyansicht im Hoch- und Querformat real geprüft;
- Stufe 1 am 09.08.2026 durch Sir abgenommen.

## Nächster notwendiger Schritt

1. Abnahmedokumentation auf Draft-PR #1 veröffentlichen und GitHub-CI bestätigen.
2. Draft-PR #1 erst nach gesonderter Freigabe in `main` einbauen.
3. Stufe 2 – Gedächtnis v1 erst nach eigener ausdrücklicher Freigabe beginnen.

OpenAI API, Sprache, Android-App und Cloud-Sync bleiben deaktiviert. Das alte Repository `RHIA`
bleibt unverändert.
