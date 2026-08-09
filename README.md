# RHIA 2.0

RHIA 2.0 wird als persönliche, lokal betreibbare und kontrollierbare Assistenz für Sir aufgebaut.
Dieses Repository ist der saubere Neustart ohne Cloudflare-, KV- oder Durable-Object-Abhängigkeit.

## Aktueller Stand

- Stufe 0: abgeschlossen und abgenommen
- Stufe 1: Local-first-Datenfundament abgeschlossen, real abgenommen und in `main` integriert
- Stufe 2: Gedächtnis v1 freigegeben; Teilmeilenstein 2.0 abgeschlossen und 2.1 lokal grün
- Betriebsart: lokale IndexedDB als einzige Datenquelle, ohne Cloud-Sync
- Web/PWA: React, Vite und TypeScript Strict
- Daten: Dexie, Zod, versionierte Migration, Export/Import und 30-Tage-Papierkorb
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

Anschließend die angezeigte lokale Adresse im Browser öffnen. In Stufe 1 speichert RHIA bewusst
eingegebene Notizen ausschließlich in der IndexedDB dieses Browsers. Andere Geräte erhalten diese
Daten erst durch einen kontrollierten Export und Import.

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
- Sicherungen können persönliche Daten enthalten und gehören nicht in Git oder öffentliche Ordner.
- Keine externe Aktion und kein kostenpflichtiger Aufruf ohne die definierte Freigabe.
- Das alte Repository `GGRLAK-04872/RHIA` bleibt unverändert als Referenz erhalten.

## Veröffentlichung

Die getrennte Testadresse lautet: https://ggrlak-04872.github.io/RHIA-2/

Der statische Testbuild enthält ausschließlich die App-Shell und keine persönlichen Daten.
`rhia.pages.dev` und produktive Cloudflare-Ressourcen werden nicht verwendet oder verändert.

Copyright © 2026 RH Produktion. Es wird derzeit keine Nutzungslizenz eingeräumt.
