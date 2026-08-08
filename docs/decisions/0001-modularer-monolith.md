# ADR 0001: TypeScript-Monorepository als modularer Monolith

- Status: angenommen
- Datum: 08.08.2026

## Entscheidung

RHIA 2.0 nutzt ein pnpm-Workspace mit TypeScript Strict. Web-App, Domäne, Verträge, Speicheradapter,
Sicherheit und spätere Dienste werden klar getrennt, aber gemeinsam versioniert.

## Gründe

- Ein persönliches System benötigt keine Microservice-Komplexität.
- Browser und späterer RHIA-PC können Typen und Verträge gemeinsam nutzen.
- Änderungen, Tests und Migrationen bleiben nachvollziehbar.

## Folgen

Direkte Datenbankzugriffe aus UI-Komponenten und frei verteilte Geschäftslogik sind nicht zulässig.
Neue Dienste entstehen erst bei einem belegten technischen Bedarf.
