# ADR 0006: Gedächtnis v1 speichert nur bestätigtes Wissen aktiv

- Status: angenommen
- Datum: 09.08.2026
- Gültig ab: Stufe 2

## Kontext

RHIA benötigt ein lokales Gedächtnis für Fakten und Entscheidungen. Gesprächsinhalte, Importe oder
automatisch erkannte Aussagen dürfen dabei nicht still zur Wahrheit werden. Korrekturen und
Widersprüche müssen dauerhaft nachvollziehbar bleiben.

## Entscheidung

Stufe 2 führt `MemoryFact`, `Decision` und `MemoryConflict` als getrennte Entitäten ein.

- Ein neuer Fakt oder eine neue Entscheidung startet grundsätzlich als `proposed`.
- Nur Sir kann einen Vorschlag mit Bestätigungszeitpunkt dauerhaft als `confirmed` aktivieren.
- Jeder Fakt besitzt Bereich, Wissensart, strukturierte Aussage, stabilen Konfliktschlüssel,
  Anzeigetext, mindestens eine Quelle und eine Geräteherkunft.
- Jede Entscheidung besitzt Begründung, Gültigkeit, mindestens eine Quelle und eine
  Geräteherkunft.
- Eine Korrektur erzeugt eine neue Revision beziehungsweise Fassung mit `supersedesId`; die frühere
  Fassung bleibt nachvollziehbar.
- Gleiche Konfliktschlüssel mit widersprechenden Werten erzeugen einen offenen `MemoryConflict`.
- Ein Konflikt bleibt offen, bis Sir ihn vollständig auflöst oder ausdrücklich als Nicht-Konflikt
  verwirft.
- Gelöschtes oder ersetztes Wissen darf durch Import oder spätere Synchronisation nicht wieder
  aktiv werden.

## Statusgrenzen

`MemoryFact` verwendet `proposed`, `confirmed`, `disputed`, `superseded` und `deleted`.
`Decision` verwendet `proposed`, `confirmed`, `superseded`, `revoked` und `deleted`.
`MemoryConflict` verwendet `open`, `resolved` und `dismissed`.

Bestätigungsfelder, Löschzeitpunkt, Gültigkeitszeitraum und Konfliktauflösung werden durch strikte
Zod-Verträge gemeinsam validiert. Unvollständige oder widersprüchliche Zustände werden abgelehnt.

## Technische Durchsetzung ab Teilmeilenstein 2.3

- Die Fabriken für Fakten und Entscheidungen erzeugen unabhängig von zusätzlichen Eingabefeldern
  ausschließlich den Status `proposed` ohne Bestätigungsdaten.
- Der lokale Anwendungsdienst verlangt für die Aktivierung ein ausdrückliches Sir-Signal und setzt
  erst dann `confirmedAt` und `confirmedBy`.
- Nur ein offener Vorschlag darf bestätigt oder abgelehnt werden. Wiederholte Aktivierung sowie das
  Ablehnen eines bereits bestätigten Datensatzes werden als ungültiger Zustandswechsel blockiert.
- Ablehnungen verwenden den bestehenden 30-Tage-Papierkorb. Vorschlag, Bestätigung und Ablehnung
  erzeugen jeweils eine technische Auditspur ohne den persönlichen Inhalt zu duplizieren.
- Bereich und sämtliche Quellen werden innerhalb derselben Transaktion geprüft. Ein fehlender Bezug
  rollt Vorschlag und Audit vollständig zurück.

## Sicherheits- und Kostengrenze

Stufe 2 speichert keine vollständigen Chats automatisch, verwendet keine externe KI, führt keine
semantische Vektorsuche aus und synchronisiert keine Daten mit einer Cloud. OpenAI bleibt technisch
deaktiviert. IndexedDB bleibt bis Stufe 4 die einzige aktive Datenquelle des jeweiligen Browsers.

## Folgen

Die Gedächtnisregeln sind unabhängig von UI und Speicheradapter testbar. Dexie-Schema,
Repository-Implementierung, Vorschlagsablauf, Konflikterkennung, Suche und Export folgen in den
Teilmeilensteinen 2.2 bis 2.8 und dürfen die hier festgelegten Bestätigungsgrenzen nicht umgehen.
