# ADR 0003: Keine Cloud-Laufzeit in Stufe 0–4

- Status: angenommen
- Datum: 08.08.2026

## Entscheidung

RHIA 2.0 benötigt in Stufe 0–4 keine Cloudflare Workers, Pages Functions, KV, Durable Objects,
Wrangler-Konfiguration oder alte API-Endpunkte. Der statische Code darf auf GitHub Pages liegen,
Geschäftsdaten bleiben lokal.

## Folgen

Die frühe Entwicklung verursacht keine Cloud-Infrastrukturkosten. Geräteabgleich erfolgt bis zum
RHIA-PC nur durch kontrollierten Export und Import. `rhia.pages.dev` bleibt unverändert.
