# ADR 0011 – Zentralen RHIA-Startstatus vor der Oberfläche laden

**Status:** durch Sirs Auftrag vom 15.08.2026 freigegeben; technische Abnahme offen

**Datum:** 15.08.2026

**Ausgangsstand:** `main` auf `b9101569a29f29bb4c0d557c890ec241117e238e`

## Entscheidung

RHIA lädt vor dem Rendern der Arbeitsoberfläche die zentrale Datei
`rhia-start-status.json`. Die Datei ist die maschinenlesbare Laufzeitprojektion von
`RHIA_ONE_START_CURRENT.md` und enthält ausschließlich den zum Start benötigten Status:

- Identität, Rolle und Anrede;
- aktiven Arbeitsmodus;
- Produktversion, Stufe, Datenquelle und API-Budget;
- freigegebene und gesperrte Laufzeitfähigkeiten.

Die freie Markdown-Dokumentation wird nicht in den öffentlichen Browserbuild kopiert. Ein
deterministisches Programm kann ihre freien Texte nicht zuverlässig als Regeln ausführen; außerdem
verbietet der bestehende Public-Build-Audit interne Markdown-Dateien. Die JSON-Projektion macht den
benötigten Teil eindeutig und prüfbar, ohne eine KI, externe API oder neue Datenquelle einzuführen.

## Startablauf

1. Die PWA lädt die gleichursprüngliche statische Startdatei.
2. RHIA prüft Struktur, bekannte Felder und alle Fähigkeitswerte.
3. RHIA gleicht Version, Stufe, Datenquelle und gesperrte externe Funktionen gegen den kompilierten
   Domänen- und Sicherheitsstand ab.
4. Nur bei erfolgreicher Prüfung wird die Arbeitsoberfläche freigegeben.
5. Fehlt die Datei, ist sie ungültig oder widersprüchlich, bleibt die Oberfläche gesperrt und zeigt
   den Fehler mit einer erneuten Lademöglichkeit an. Es gibt keinen Ersatz-Startstatus.

Der geladene Status liegt danach über einen React-Kontext intern vor. Navigation und einmalige
Browser-Spracherkennung respektieren die geladenen Fähigkeitsfreigaben. Der Kopfbereich zeigt
sichtbar `Startstatus geladen`; der Systemstatus zeigt den aktiven Arbeitsmodus.

## Unveränderte Grenzen

- IndexedDB, Dexie-Version 5 und Sicherungsformat 4 bleiben unverändert.
- Keine neue Geschäftsdatenquelle, Migration oder Datenlogik.
- Keine externe KI, kein API-Aufruf, kein Cloud-Fallback und keine laufenden Kosten.
- Keine neue Integration, kein Wake-Word und keine schreibende externe Aktion.
- Sicherheitsregeln können durch die Startdatei nicht gelockert werden. Ein Widerspruch blockiert
  den Start sichtbar.

## Offline- und PWA-Verhalten

Die Startdatei wird als statische PWA-Datei in den bestehenden Workbox-Precache aufgenommen. Nach
einem erfolgreichen Online-Aufruf kann eine installierte PWA sie deshalb aus demselben geprüften
Build laden. Fehlt sie auch dort, startet RHIA nicht heimlich mit fest verdrahteten Ersatzwerten.

## Prüfung

- Unit-Tests für gültige Datei, fehlende Datei und widersprüchliche Stufe;
- Komponententests für Lade-, Fehler- und Wiederholungsablauf;
- Browser-Smoke für sichtbaren geladenen Status und blockierten Start bei HTTP 404;
- vollständiger `pnpm check`, CI und Pages-Preview vor Sirs Geräteprüfung.

## Rücknahme

Die Änderung liegt auf dem getrennten Branch `agent/rhia-startstatus-loader`. Solange kein Merge
freigegeben ist, bleibt `main` unverändert. Die Rücknahme besteht im Schließen des Draft-PR.
