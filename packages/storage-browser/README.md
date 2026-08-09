# Browser-Speicher – Stufen 1 und 2

Dieses Paket stellt die einzige RHIA-Datenquelle der Stufen 1–4 bereit:

- IndexedDB mit Dexie;
- versioniertes Schema für `Area`, `Source`, `Note`, `AuditEntry`, `MemoryFact`, `Decision` und
  `MemoryConflict`;
- Repository-Schnittstellen statt direkter Datenbankzugriffe aus der UI;
- optimistische Revisionsprüfung gegen verlorene Änderungen;
- Soft-Delete und Wiederherstellung ohne versteckte Ersatzquelle;
- gemeinsame Transaktionen über alle sieben Tabellen;
- verlustfreie Migration vom veröffentlichten Stufe-1-Schema auf die Gedächtnistabellen.

Das veröffentlichte Stufe-1-Schema verwendet bereits Dexie-Version 2. Die additive
Gedächtnismigration verwendet deshalb Dexie-Version 3; vorhandene Version-1- und
Version-2-Datenbanken bleiben vollständig migrierbar.

Sicherungsformat v2 enthält alle sieben Sammlungen einschließlich Fakten, Entscheidungen,
Konflikten und ihrer gelöschten oder ersetzten Zustände. Gültige v1-Sicherungen werden nach
Prüfsummen- und Vertragsprüfung mit leeren Gedächtnissammlungen auf v2 migriert. Importkonflikte
werden für jede Sammlung vor der atomaren Übernahme sichtbar blockiert.

OpenAI, Cloud-Synchronisation und alte RHIA-Speicherquellen sind nicht angebunden.
