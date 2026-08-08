# Lokaler Start und Fehlergrenzen

## Start

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Erwarteter Zustand

Die App zeigt Stufe 0, `Nur lokal`, `OpenAI API: Deaktiviert`, `Cloud-Speicher: Nicht verbunden`
und `Datenbank: Ab Stufe 1`.

## Fehler

- Installationsfehler: Node 24 und pnpm 11 prüfen; nicht auf einen anderen Paketmanager ausweichen.
- Startfehler: sichtbare Fehlermeldung dokumentieren; keine alte RHIA-Adresse als Ersatz verwenden.
- Build-Audit schlägt an: betroffene Datei oder Referenz entfernen und Prüfung wiederholen.
- API-Schlüssel fehlt: in Stufe 0 erwarteter Zustand; keinen Schlüssel im Browser hinterlegen.
