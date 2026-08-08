# Architekturübersicht

RHIA 2.0 ist ein modularer Monolith in einem TypeScript-Monorepository.

```text
Web/PWA -> Anwendungs- und Domänendienste -> Repository-Schnittstellen
                                               |-> IndexedDB ab Stufe 1
                                               `-> RHIA-PC API ab Stufe 5
```

Für Stufe 0 gilt: Die App-Shell besitzt keine Geschäftsdatenbank, ruft keine externe API auf und
enthält keine alte Cloudflare-Laufzeit. Verbindliche Details stehen im Masterplan und in den ADRs.
