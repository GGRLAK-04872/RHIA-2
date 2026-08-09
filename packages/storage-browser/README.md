# Browser-Speicher – Stufe 1

Dieses Paket stellt die einzige RHIA-Datenquelle der Stufen 1–4 bereit:

- IndexedDB mit Dexie;
- versioniertes Schema für `Area`, `Source`, `Note` und `AuditEntry`;
- Repository-Schnittstellen statt direkter Datenbankzugriffe aus der UI;
- optimistische Revisionsprüfung gegen verlorene Änderungen;
- Soft-Delete und Wiederherstellung ohne versteckte Ersatzquelle;
- gemeinsame Transaktionen über alle vier Tabellen.

OpenAI, Cloud-Synchronisation und alte RHIA-Speicherquellen sind nicht angebunden.
