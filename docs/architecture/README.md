# Architekturübersicht

RHIA 2.0 ist ein modularer Monolith in einem TypeScript-Monorepository.

```text
Web/PWA -> Anwendungsdienst -> Repository-Schnittstellen -> Dexie -> IndexedDB
                              später ab Stufe 5 -> RHIA-PC API -> SQLite
```

Für Stufe 1 gilt: IndexedDB ist die einzige Geschäftsdatenquelle des jeweiligen Browsers. Direkte
UI-Zugriffe, alte Browserdaten, Cloud-Fallbacks und externe APIs sind ausgeschlossen. Verbindliche
Details stehen im Masterplan sowie in ADR 0002 und ADR 0005.
