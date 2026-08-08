# RHIA 2.0 – Projektstand

Stand: 08.08.2026

## Aktuelle Stufe

Stufe 1 – Local-first-Datenfundament. Von Sir am 08.08.2026 freigegeben, technisch umgesetzt und
vor dem abschließenden realen Tablet-/Handy-Praxistest.

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

## Nächster notwendiger Schritt

1. Vollständigen lokalen Prüflauf und GitHub-CI bestätigen.
2. Stufe-1-Testbuild unter der getrennten RHIA-2-Testadresse bereitstellen.
3. Sir führt die dokumentierten Tests auf Tablet und Handy mit künstlichen Daten aus.
4. Erst nach ausdrücklicher Abnahme darf Stufe 2 beginnen.

OpenAI API, Sprache, Android-App und Cloud-Sync bleiben in Stufe 1 deaktiviert. Für Sirs
Praxistest sind ungefähr 20–40 Minuten vorgesehen.
