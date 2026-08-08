# RHIA 2.0 – Projektstand

Stand: 08.08.2026

## Aktuelle Stufe

Stufe 0 – Neustartbasis und Repository.

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

## Offen vor Abschluss von Stufe 0

1. Öffentliches Repository `GGRLAK-04872/RHIA-2` einmalig anlegen.
2. Lokalen geprüften Stand auf `main` veröffentlichen.
3. GitHub CI und getrennte GitHub-Pages-Testadresse bestätigen.
4. Android-Browser-Praxistest auf Tablet oder Handy durch Sir.
5. Ergebnis und Datum im Abnahmeprotokoll eintragen.

Der lokale Playwright-Test konnte in Work nicht ausgeführt werden, weil die Umgebung den
Chromium-Download blockiert und keinen Systembrowser enthält. Die identischen Tests sind in GitHub
CI eingerichtet und werden nach der ersten Veröffentlichung automatisch ausgeführt.

Stufe 1 beginnt erst nach diesen fünf Punkten.
