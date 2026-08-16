# Architekturübersicht

RHIA 2.0 ist ein modularer Monolith in einem TypeScript-Monorepository.

```text
Startstatus -> Web/PWA -> Anwendungsdienst -> Repository-Schnittstellen -> Dexie -> IndexedDB
                                             später ab Stufe 5 -> RHIA-PC API -> SQLite
```

Vor der Oberfläche lädt die PWA den maschinenlesbaren `rhia-start-status.json`, prüft ihn gegen
Domänen- und Sicherheitskonstanten und stellt ihn der Oberfläche intern bereit. Ein fehlender,
ungültiger oder widersprüchlicher Startstatus blockiert den Start sichtbar; es gibt keinen
Fallback. Details stehen in ADR 0011.

Für Stufe 1 gilt: IndexedDB ist die einzige Geschäftsdatenquelle des jeweiligen Browsers. Direkte
UI-Zugriffe, alte Browserdaten, Cloud-Fallbacks und externe APIs sind ausgeschlossen. Verbindliche
Details stehen im Masterplan sowie in ADR 0002 und ADR 0005.
