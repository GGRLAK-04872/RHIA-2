# ADR 0005: Local-first-Datenmodell in Stufe 1

- Status: angenommen
- Datum: 08.08.2026

## Entscheidung

Stufe 1 verwendet ausschließlich die IndexedDB `rhia-2` über Dexie. Die UI greift nicht direkt
auf IndexedDB zu, sondern auf einen Anwendungsdienst und austauschbare Repository-Schnittstellen.

Das Basisschema enthält:

- `Area` für Lebens- und Arbeitsbereiche;
- `Source` für die Herkunft lokaler Informationen;
- `Note` für strukturierte Notizen;
- `AuditEntry` als Änderungsreferenz.

Alle Datensätze besitzen UUID, Typ, Datenschema-Version, Revision, Erstellungs- und
Änderungszeitpunkt sowie einen Löschzeitpunkt. Schreibkonflikte werden über erwartete Revisionen
abgelehnt. Gelöschte Datensätze bleiben 30 Tage im Papierkorb.

## Sicherung und Migration

- Dexie-Schemaversionen besitzen explizite Migrationspfade.
- RHIA-Sicherungen sind versionierte JSON-Pakete mit SHA-256-Prüfsumme.
- Ein Import wird vorab validiert und zeigt ID-Konflikte an.
- Ohne ausdrückliche Strategie werden vorhandene Datensätze nicht überschrieben.
- Die vollständige lokale Löschung erfordert die exakte Bestätigungsphrase.

## Folgen

Bis Stufe 5 ist die IndexedDB des jeweiligen Browsers die einzige Datenquelle. Zwischen Geräten
findet kein improvisierter Cloud-Abgleich statt. Export und Import sind der kontrollierte
Übertragungsweg. OpenAI, Sprache und externe Aktionen bleiben deaktiviert.
