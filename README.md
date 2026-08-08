# RHIA 2.0

RHIA 2.0 wird als persönliche, lokal betreibbare und kontrollierbare Assistenz für Sir aufgebaut.
Dieses Repository ist der saubere Neustart ohne Cloudflare-, KV- oder Durable-Object-Abhängigkeit.

## Aktueller Stand

- Stufe 0: Neustartbasis
- Betriebsart: lokal, ohne API und ohne persistente Nutzerdaten
- Web/PWA: React, Vite und TypeScript Strict
- Qualität: Biome, Vitest, Playwright, Build- und Secret-Audit
- OpenAI API: deaktiviert; ein vorhandener Schlüssel wird erst später sicher und ausschließlich
  serverseitig eingebunden

Die verbindliche Grundlage wird in einem privaten Masterplan geführt. Eine Stufe gilt erst nach
automatisierter Prüfung und dem vorgesehenen Praxistest als abgeschlossen.

## Lokaler Start

Voraussetzungen: Node.js 24 LTS und pnpm 11.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Anschließend die angezeigte lokale Adresse im Browser öffnen. RHIA speichert in Stufe 0 keine
persönlichen Daten.

## Prüfung

```bash
pnpm check
```

Der vollständige Browser-Smoke-Test läuft mit:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Schutzregeln

- Keine Secrets, Datenbanken, Exporte, Backups, Audioaufnahmen oder personenbezogenen Daten in Git.
- Keine API-Schlüssel oder Besitzer-Tokens im Browser.
- Kein stiller Rückfall auf alte RHIA-, Cloudflare- oder Browserdatenquellen.
- Keine externe Aktion und kein kostenpflichtiger Aufruf ohne die definierte Freigabe.
- Das alte Repository `GGRLAK-04872/RHIA` bleibt unverändert als Referenz erhalten.

## Veröffentlichung

Die getrennte Testadresse lautet: https://ggrlak-04872.github.io/RHIA-2/

Der statische Testbuild enthält ausschließlich die App-Shell und keine persönlichen Daten.
`rhia.pages.dev` und produktive Cloudflare-Ressourcen werden nicht verwendet oder verändert.

Copyright © 2026 RH Produktion. Es wird derzeit keine Nutzungslizenz eingeräumt.
