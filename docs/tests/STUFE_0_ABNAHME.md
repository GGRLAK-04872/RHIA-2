# Abnahmeprotokoll – Stufe 0

Stand: 08.08.2026

Stufe 0 bleibt offen, bis alle automatisierten Prüfungen, die getrennte Veröffentlichung und der
reale Android-Browser-Test bestätigt sind.

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
| Tablet-/Handy-/Desktop-Smoke | `pnpm test:e2e` | lokal blockiert: Browserdownload; in CI eingerichtet |
| GitHub CI | `.github/workflows/ci.yml` | ausstehend bis Veröffentlichung |

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

- [ ] Alle automatisierten Prüfungen grün
- [ ] Öffentlicher Build unter getrennter RHIA-2-Testadresse erreichbar
- [ ] Android-Tablet oder -Handy bestanden
- [ ] Ergebnis und Testdatum von Sir bestätigt
- [ ] Stufe 1 ausdrücklich freigegeben
