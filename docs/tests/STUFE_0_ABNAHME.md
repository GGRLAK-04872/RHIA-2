# Abnahmeprotokoll – Stufe 0

Stand: 08.08.2026

Stufe 0 ist abgeschlossen. Sir bestätigte den realen Android-Browser-Test am 08.08.2026 mit
`Android-Test bestanden`.

## Automatisierte Prüfung

| Prüfung | Befehl/Quelle | Status |
|---|---|---|
| reproduzierbare Installation | `pnpm install`; Lockfile erzeugt | bestanden |
| TypeScript Strict | `pnpm typecheck` | bestanden |
| Format und Lint | `pnpm format:check && pnpm lint` | bestanden |
| Unit-/Komponententests | `pnpm test` | bestanden: 6/6 |
| Produktionsbuild und PWA | `pnpm build` | bestanden |
| öffentlicher Build ohne interne Dateien/Alt-APIs | `pnpm audit:public` | bestanden |
| keine Schlüssel- oder Tokenmuster | `pnpm scan:secrets` | bestanden |
| bekannte Produktionsabhängigkeitslücken | `pnpm audit:deps` | bestanden: 0 |
| lokaler HTTP-Smoke | Index, Manifest, Service Worker und Icon | bestanden: jeweils HTTP 200 |
| Tablet-/Handy-/Desktop-Smoke | `pnpm test:e2e` | bestanden in GitHub CI mit Chromium |
| GitHub CI | `.github/workflows/ci.yml` | bestanden |
| getrennte Testbereitstellung | GitHub Pages | bestanden und erreichbar |

## Praxistest durch Sir

Voraussetzung: getrennte GitHub-Pages-Adresse von `GGRLAK-04872/RHIA-2`, niemals
`rhia.pages.dev`.

1. Link auf dem Android-Tablet öffnen.
2. Prüfen, dass `RHIA 2.0` und `Die lokale Neustartbasis ist bereit.` sichtbar sind.
3. Tablet hochkant und quer drehen; keine abgeschnittenen Bedienelemente oder unlesbaren Texte.
4. Browserseite neu laden; dieselbe Statusansicht erscheint ohne Anmeldedialog.
5. Optional als PWA installieren und erneut öffnen.
6. Bestätigen, dass keine persönlichen Daten eingegeben werden müssen.

## Abschluss

- [x] Alle automatisierten Prüfungen grün
- [x] Öffentlicher Build unter getrennter RHIA-2-Testadresse erreichbar
- [x] Android-Tablet oder -Handy bestanden
- [x] Ergebnis und Testdatum von Sir bestätigt: 08.08.2026
- [x] Stufe 1 ausdrücklich freigegeben: 08.08.2026

## Ergebnis

Stufe 0 ist technisch und im realen Android-Browser abgenommen. Sir hat Stufe 1 am 08.08.2026
ausdrücklich freigegeben.
