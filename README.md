# RHIA 2.0

RHIA 2.0 wird als persönliche, lokal betreibbare und kontrollierbare Assistenz für Sir aufgebaut.
Dieses Repository ist der saubere Neustart ohne Cloudflare-, KV- oder Durable-Object-Abhängigkeit.

## Aktueller Stand

- Stufe 0: abgeschlossen und abgenommen
- Stufe 1: Local-first-Datenfundament abgeschlossen, real abgenommen und in `main` integriert
- Stufe 2: Gedächtnis v1 freigegeben; Teilmeilensteine 2.0 bis 2.8 technisch umgesetzt
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

Der lokale Gedächtnisdienst legt Fakten und Entscheidungen ausschließlich als inaktive Vorschläge
an. Erst ein ausdrückliches Bestätigungssignal von Sir aktiviert sie; Ablehnungen bleiben im
Papierkorb und in der Auditspur nachvollziehbar. Die responsive Bedienoberfläche stellt diesen
Lebenszyklus sichtbar bereit.

Korrekturen erzeugen eine neue, zunächst inaktive Fassung. Bis zu deren ausdrücklicher Bestätigung
bleibt die bisherige Fassung aktiv; danach werden neue Fassung und Vorgänger atomar als
`confirmed` beziehungsweise `superseded` gespeichert. Verwerfen und die vollständige
Fassungshistorie bleiben nachvollziehbar, ohne stilles Wiederbeleben älterer Inhalte.

Abweichende Werte unter demselben stabilen Konfliktschlüssel werden nicht automatisch
überschrieben. RHIA markiert beide Fakten sichtbar als strittig und hält einen offenen Konflikt,
bis Sir ausdrücklich einen Fakt beibehält oder den Fall als Nicht-Konflikt verwirft.

Die Gedächtnissuche arbeitet vollständig lokal. Sie kombiniert normalisierten Volltext mit Filtern
für Bereich, Typ, Status, Quelle, Gültigkeit und Änderungszeit und zeigt bei jedem Treffer dessen
Bereich, Quellen und Aktualität an.

Sicherungen werden im Format v2 mit allen sieben lokalen Sammlungen erstellt. Gültige v1-Dateien
bleiben importierbar und werden ohne erfundene Gedächtnisdaten migriert. Prüfsummenfehler oder
vorhandene IDs blockieren den Import sichtbar.

Die Gedächtnisoberfläche unterstützt Fakt- und Entscheidungsvorschläge, Bestätigung, Ablehnung,
Korrektur, Papierkorb, Konfliktauflösung sowie Suche und Filter. Fehler bleiben sichtbar; die
Bedienung ist für Handy, Tablet, Hoch- und Querformat ausgelegt.

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
