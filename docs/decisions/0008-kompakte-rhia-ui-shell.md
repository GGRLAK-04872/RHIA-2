# ADR 0008 – Kompakte RHIA-UI-Shell während Stufe 4

**Status:** umgesetzt, technische und reale Abnahme noch offen  
**Datum:** 12.08.2026  
**Ausgangsstand:** `agent/stufe-4-planung-briefings` auf
`d611baffd35f2ad125fcfb3edbf3226b6efae4b1`

## Ziel

Die lange, vollständig untereinander gestapelte RHIA-Seite wird durch eine kompakte,
responsive Anwendungsshell ersetzt. RHIA bleibt als zentrale visuelle Präsenz sichtbar. Genau
ein fachlicher Hauptbereich wird gleichzeitig angezeigt. Die laufende Stufe-4-Schnellabnahme,
lokale Daten und alle Fachregeln bleiben unverändert.

## Verbindliche Grenzen

- keine Änderung an Domäne, Priorisierung, Planung, Feedbackwirkung oder Schutzzeit;
- keine Änderung an Dexie-Version 5 oder Sicherungsformat 4;
- keine externe Datenquelle, Synchronisation, KI, Sprache, Mikrofon- oder Chatfunktion;
- keine neue Laufzeitabhängigkeit und keine laufenden Kosten;
- Produktversion 0.4.0 und aktive Stufe 4 bleiben unverändert;
- `main` und Draft-PR #6 bleiben bis zu Sirs Freigabe ungemergt;
- Sirs vorhandene Browserdaten werden nicht migriert, gelöscht oder zurückgesetzt.

## Entscheidung

### Anwendungsshell

Die bestehende `App.tsx` erhält:

1. eine feste Kopfzeile mit ehrlichem lokalem Bereitschaftsstatus;
2. eine dauerhaft sichtbare RHIA-Präsenz mit reinem CSS-Organismus;
3. einen intern scrollbareren Modulbereich;
4. eine feste Hauptnavigation mit:
   - Übersicht,
   - Gedächtnis,
   - Aufgaben,
   - Planung,
   - Daten & Sicherung;
5. responsive Tablet- und Handyvarianten ohne horizontale Überbreite.

Alle fünf Fachbereiche bleiben im React-Baum montiert. Nicht aktive Bereiche werden mit
zugänglichen Tabs ausgeblendet. Dadurch bleiben ungespeicherte Formularzustände bei einem
Bereichswechsel erhalten, ohne eine zweite Datenquelle einzuführen.

### Planung

Das vorhandene Planungsmodul wird zusätzlich in vier sichtbare Unterbereiche gegliedert:

- Tagesplan,
- Woche,
- Briefings,
- Feedback.

Die vorhandenen Aktionen und Texte bleiben erhalten. Die Navigation fügt lediglich einen
zusätzlichen bewussten Klick hinzu. Fachprüfungen werden deshalb an die neue Navigation angepasst,
nicht entfernt oder abgeschwächt.

### RHIA-Organismus

Der Organismus besteht ausschließlich aus CSS-Verläufen, Rahmen, Schatten und ruhigen
Transformationen. Er lädt keine externe Grafik und besitzt keine fachliche Funktion.
`prefers-reduced-motion` schaltet alle Animationen ab. Der Text `Ja, Sir?` ist ein statischer
Bestandteil der Oberfläche und behauptet keinen aktiven Sprach- oder Chatdialog.

## Vollständiger aktiver Softwarestack für diese Umsetzung

| Ebene | Eingesetzte Technik | Verwendung im UI-Umbau |
|---|---|---|
| Laufzeit | Node.js 24 LTS | reproduzierbarer Build und Testlauf |
| Paketverwaltung | pnpm 11.16 mit Workspace und Lockfile | unveränderte Abhängigkeitsbasis |
| Sprache | TypeScript 7 im Strict-Modus | typisierte Shell, Modul- und Tabzustände |
| Weboberfläche | React 19.2 | vorhandene Fachkomponenten und neue Shell |
| Routing | React Router 7.18 | bleibt installiert; für lokale Shell-Tabs ist keine URL-Routing-Erweiterung nötig |
| Build | Vite 8.2 | Produktions- und GitHub-Pages-Build |
| PWA | vite-plugin-pwa 1.3 und Workbox | unveränderte statische App-Shell |
| Gestaltung | CSS Modules und vorhandene Design-Tokens | responsive Shell und CSS-Organismus |
| Geschäftsdaten | IndexedDB über Dexie 4, veröffentlichtes Schema 5 | unverändert einzige aktive Datenquelle |
| Validierung | Zod 4 | unveränderte Verträge und Importprüfung |
| Integrität | Web Crypto, UUID und SHA-256 | unveränderte Sicherungsprüfung |
| Format und Lint | Biome 2.5 | Quelltext- und Zugänglichkeitsprüfung |
| Komponenten- und Unit-Tests | Vitest 4.1, React Testing Library 16, fake-indexeddb 6 | Navigation und unveränderte Fachabläufe |
| Browser-Tests | Playwright 1.62 mit Chromium | Desktop, Tablet, Handy, Hoch- und Querformat |
| Veröffentlichung | GitHub Actions und GitHub Pages | CI und statische Praxistestseite |

Es werden keine zusätzlichen npm-Pakete, Bild-CDNs, Schrift-CDNs, Analysewerkzeuge oder
kostenpflichtigen Dienste eingeführt.

## Umsetzungsfolge

1. Ist-Stand von `main`, PR #6, CI, Pages, Masterplan und Abnahme verifizieren.
2. Separaten Branch vom tatsächlichen PR-6-Head erstellen.
3. Shell und Hauptnavigation implementieren.
4. Planung in Unterbereiche gliedern.
5. Unit- und Browsertests fachlich korrekt an die Navigation anpassen.
6. Format, Lint, TypeScript, 102+ Tests, PWA-Build und Audits lokal ausführen.
7. Draft-PR ohne Merge erstellen und CI sowie GitHub-Pages-Preview prüfen.
8. Sir führt einen kurzen UI-Praxistest auf Tablet und Handy durch.
9. Erst nach ausdrücklicher UI-Freigabe darf der Stand in den Stufe-4-Branch übernommen werden.

## Technische Abnahme

Vor Übergabe an Sir müssen mindestens bestanden sein:

- `pnpm check`;
- alle unveränderten Domänen-, Speicher-, Import-, Planungs- und UI-Tests;
- Playwright auf Desktop, Tablet und Handy;
- Hauptnavigation in vier Referenz-Viewports ohne horizontale Überbreite;
- Erreichbarkeit aller Stufe-4-Pflichtaktionen;
- GitHub-CI und Pages-Deployment auf demselben Commit;
- öffentlicher Build ohne externe KI, Cloud-Fallback oder Secrets.

## Realer UI-Praxistest durch Sir

Die Oberfläche ist erst angenommen, wenn Sir auf der Preview mindestens bestätigt:

1. Übersicht und RHIA-Präsenz entsprechen dem gewünschten Grundbild.
2. Alle fünf Hauptbereiche sind in Tablet-Querformat erreichbar.
3. Tagesplan, Woche, Briefings und Feedback sind in Planung erreichbar.
4. Aufgaben, Gedächtnis sowie Daten & Sicherung bleiben vollständig bedienbar.
5. Handy-Hoch- und -Querformat besitzen keine abgeschnittene Pflichtaktion.
6. Wechsel zwischen Bereichen löscht keine bereits eingegebenen, noch ungespeicherten Formwerte.
7. Sir gibt die UI ausdrücklich frei.

Dieser UI-Praxistest ersetzt nicht Z01 bis Z05 der fachlichen Stufe-4-Schnellabnahme.

## Rücknahme

Solange der UI-Branch nicht in `agent/stufe-4-planung-briefings` übernommen wurde, besteht die
vollständige Rücknahme darin, den Draft-PR zu schließen. PR #6, `main`, Dexie-Schema, Sicherungen
und Sirs lokale Daten bleiben davon unberührt.
