# ADR 0010 – RHIA WebGL Presence im Startcockpit

**Status:** umgesetzt; optische und funktionale Abnahme offen

**Datum:** 14.08.2026

**Ausgangsstand:** `main` auf `b9101569a29f29bb4c0d557c890ec241117e238e`

**Isolierter Presence-Stand:** `11a9e06a79bc311ea31bf1cfcb753614de8ca01b`

## Ziel

Die isoliert freigegebene RHIA WebGL Presence wird ausschließlich in den visuellen
Startcockpit-Bereich der bestehenden RHIA-Shell eingebettet. Die fachlichen Module, lokalen Daten,
Sprachfreigabe und vorhandenen Bedienabläufe bleiben unverändert.

## Entscheidung

- Die Presence ersetzt nur den bisherigen dekorativen Organismus in `App.tsx`.
- Der WebGL-Renderer bleibt transparent und ohne rechteckige Hintergrundfläche.
- Die freigegebenen Shader-, Farb-, Belichtungs- und Szenenparameter bleiben erhalten. Dadurch
  bleiben Nebel, Filamente, Lichtknoten, Tiefenpartikel und der weiche weiß-magenta Kern getrennt
  erkennbar; eine zusätzliche Weißaufhellung wird nicht eingeführt.
- Die Lebendigkeit findet in Lichtimpulsen, Knoten, Nebelschichten, Partikeln und Kern statt. Die
  Gesamtform bewegt sich nur dezent.
- Die Presence ist rein dekorativ, `aria-hidden` und erhält keine Pointer-Ereignisse. Vorhandene
  Touch-Ziele bleiben damit vollständig bedienbar.
- Die WebGL-Komponente wird erst im Browser und per React-Lazy-Import geladen. Bei fehlendem oder
  verlorenem WebGL-Kontext bleibt eine transparente, statische SVG-Presence sichtbar.
- Bei `prefers-reduced-motion` wird nur ein ruhiger WebGL-Einzelframe gerendert; die statische
  Fallback-Presence besitzt ebenfalls keine Bewegung.
- Die Renderfrequenz ist auf 40 Bilder pro Sekunde und die Pixeldichte auf 1,5 begrenzt. Unsichtbare
  Tabs pausieren, Größenänderungen werden beobachtet und GPU-Ressourcen beim Abbau freigegeben.

## Verbindliche Grenzen

- keine Änderung an Domäne, Datenlogik, Dexie-Schema, Sicherung oder Wiederherstellung;
- keine neuen Produktfunktionen, Systemwerte oder externen Integrationen;
- kein Dauerhören und keine Änderung der einmaligen Mikrofonfreigabe;
- keine Änderung außerhalb der Startcockpit-Darstellung;
- kein Merge ohne ausdrückliche optische und funktionale Freigabe durch Sir.

## Geänderte Oberfläche

| Datei | Zweck |
|---|---|
| `apps/web/src/App.tsx` | vorhandenen dekorativen Organismus durch Presence-Stage ersetzen |
| `apps/web/src/App.module.css` | transparente, responsive Fläche im bestehenden Hero-Layout |
| `apps/web/src/components/RhiaPresenceStage.tsx` | WebGL-Erkennung, Lazy-Load und Fallback-Umschaltung |
| `apps/web/src/components/RhiaWebGLPresence.jsx` | freigegebene isolierte Three.js-Presence |
| `apps/web/src/components/RhiaPresenceFallback.tsx` | statischer transparenter Fallback |
| `apps/web/src/components/RhiaWebGLPresence.module.css` | rahmenlose Einbettung und weicher Randübergang |

## Abnahme

Vor einer Freigabe werden mindestens geprüft:

1. Format, Lint, TypeScript, Unit-Tests, Produktionsbuild und Sicherheitsprüfungen;
2. fachliche Chromium-Smoke-Tests auf Desktop, Tablet und Mobilgerät im statischen
   Reduced-Motion-Modus, damit softwaregerendertes WebGL die unveränderten Cockpit-Abläufe in CI
   nicht blockiert;
3. Tablet-Querformat bei 1280 × 800 Pixeln ohne horizontale Überbreite;
4. WebGL-Integration als statischer Einzelframe einmal gezielt im Tablet-Querformat sowie
   transparente Einbettung ohne schwarzen oder rechteckigen Rahmen; laufende Animation und
   Performance werden auf der veröffentlichten Preview und realer Tablet-Hardware geprüft;
5. Bedienbarkeit von Mikrofontaste, Aufgabeingabe, Modulen und Navigation;
6. sichtbare Abstufung von Nebel, Filamenten, Knoten, Tiefenpartikeln und Energiekern;
7. optische und funktionale Abnahme der veröffentlichten Preview durch Sir.

Bis zu dieser ausdrücklichen Abnahme bleibt der Arbeitsstand auf
`agent/rhia-webgl-cockpit-integration` ungemergt.
