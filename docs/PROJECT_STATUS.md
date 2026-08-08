# RHIA 2.0 – Projektstand

Stand: 08.08.2026

## Aktuelle Stufe

Stufe 0 – abgeschlossen und am 08.08.2026 im realen Android-Browser abgenommen.

Freigabepunkt vor Stufe 1 – Local-first Datenfundament.

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

## Nächster notwendiger Schritt

1. Sir gibt Stufe 1 ausdrücklich frei.
2. Danach beginnt ausschließlich das Local-first Datenfundament mit Dexie/IndexedDB.
3. OpenAI API, Sprache, Android-App und Cloud-Sync bleiben in Stufe 1 deaktiviert.

Geplanter Aufwand für Stufe 1: ungefähr 8–16 Stunden Work-Zeit und etwa 20–40 Minuten Testzeit
durch Sir, aufgeteilt in klar abgegrenzte Umsetzungsschritte.

Stufe 1 beginnt erst nach ausdrücklicher Freigabe.
