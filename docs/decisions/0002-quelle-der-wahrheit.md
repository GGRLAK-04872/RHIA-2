# ADR 0002: Eine eindeutige Quelle der Wahrheit

- Status: angenommen
- Datum: 08.08.2026

## Entscheidung

- Stufe 0: noch keine Geschäftsdatenquelle.
- Stufen 1–4: ausschließlich lokale IndexedDB des jeweiligen Browsers.
- Ab Stufe 5: zentrale SQLite-Datenbank auf dem RHIA-PC; Browser halten nur Cache und Outbox.

## Folgen

Es gibt keinen parallelen Browser-, Seed-, KV- oder Cloudflare-Fallback. Fehler werden sichtbar
gemeldet. Gelöschte Datensätze dürfen nicht aus einer älteren Quelle wiederbelebt werden.
