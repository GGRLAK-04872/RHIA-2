# ADR 0010 – Räumliche RHIA-Präsenz im Startcockpit

**Status:** technisch umgesetzt; automatische Prüfung und reale Sichtabnahme offen

**Datum:** 13.08.2026

**Ausgangsstand:** `main` auf `b9101569a29f29bb4c0d557c890ec241117e238e`

## Ziel

Das funktional abgenommene Startcockpit wird ausschließlich visuell näher an Sirs bestätigte
Referenz gebracht. RHIA soll als räumliche, organische und kontrollierte Präsenz wirken, ohne
Aufgaben-, Speicher-, Planungs-, Mikrofon- oder Bestätigungslogik zu verändern.

## Ursache der bisherigen Abweichung

Der bisherige visuelle Kern kombinierte geschlossene CSS-Ringe mit einem kreisförmig begrenzten
Partikelfeld. Dadurch wirkte RHIA trotz Filamenten wie eine flache Radar- oder Metallscheibe.
Cockpitkarten, Hintergrund und RHIA-Kern lagen außerdem optisch weitgehend auf derselben Ebene.

## Entscheidung

1. Der visuelle Kern wird in die eigenständige Komponente `RhiaPresence` ausgelagert.
2. Die Präsenz verwendet ein deterministisches responsives SVG mit getrennten Ebenen für:
   - entfernte Lichtpunkte;
   - unregelmäßige Orbitbahnen;
   - organische Bänder;
   - nahe Filamente und Knoten;
   - Kernlicht und Tiefennebel.
3. Es gibt keine geschlossene äußere Scheibe und keine dauerhaft vollständig rotierenden Elemente.
4. Nur Transformation und Deckkraft weniger Ebenen werden langsam animiert.
5. `prefers-reduced-motion` schaltet sämtliche Animationen der Präsenz ab.
6. Systemstatus, Mikrofontaste und Cockpit erhalten eine gestaffelte Glas- und Schattenwirkung.
7. Der nächste sinnvolle Schritt bleibt die optisch wichtigste Cockpitfläche.
8. Tablet-Hochformat und Tablet-Querformat behalten vollständige Touch- und Textbedienung.

## Technische Grenze

Die Umsetzung erzeugt eine leistungsarme 2,5D-Wirkung mit React, SVG und CSS. Sie führt weder
WebGL noch Three.js oder eine andere Laufzeitabhängigkeit ein. Eine echte volumetrische
Partikelsimulation ist nicht Bestandteil dieses Meilensteins.

## Unveränderte Grenzen

- Produktversion `0.4.1`, aktive Stufe 4 und alle Domänenverträge bleiben unverändert.
- Dexie-Version 5, Sicherungsformat 4 und IndexedDB als einzige aktive Datenquelle bleiben
  unverändert.
- Es gibt keine externe KI, OpenAI API, Cloud-Synchronisation oder neue laufende Kosten.
- Mikrofon-Einwilligung, einmalige Browser-Spracherkennung und Text-Ersatzweg bleiben unverändert.
- Es werden keine echten CPU-, RAM- oder Netzwerkwerte vorgetäuscht.
- `main`, PR #6 und PR #7 werden durch diesen Branch nicht verändert.

## Prüfung und Abnahme

Vor der Preview müssen mindestens bestehen:

- `pnpm check`;
- vorhandene 111 Unit- und Komponententests;
- PWA-Produktionsbuild und öffentliche Audits;
- Browser-Smoke auf Desktop, Tablet und Handy;
- Startcockpit in Tablet-Hoch- und -Querformat ohne horizontale Außenüberbreite;
- sichtbare Mikrofontaste, Schnelleingabe und Hauptnavigation;
- keine aktive Organismusanimation bei reduzierter Bewegung.

Die visuelle Abnahme erfolgt durch Sir auf der GitHub-Pages-Preview. Ein Merge ist ohne erneute
ausdrückliche Freigabe ausgeschlossen.
