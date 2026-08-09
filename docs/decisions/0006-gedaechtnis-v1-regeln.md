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

## Korrektur und Historie ab Teilmeilenstein 2.4

- Normale Vorschläge dürfen keinen selbst gesetzten Vorgängerbezug übernehmen. `supersedesId` wird
  ausschließlich durch den kontrollierten Korrekturablauf gesetzt.
- Eine Korrektur erzeugt eine neue Fassung im Status `proposed`. Die bestätigte Vorgängerfassung
  bleibt aktiv, bis Sir die Korrektur ausdrücklich bestätigt.
- Bei Bestätigung werden die neue Fassung und ihr Vorgänger in einer Transaktion auf `confirmed`
  beziehungsweise `superseded` gesetzt. Ein Revisionsfehler rollt beide Änderungen zurück.
- Pro aktiver Fassung darf nur ein nicht verworfener direkter Korrekturstand existieren.
- Das Verwerfen einer Korrektur lässt die bestätigte Vorgängerfassung unverändert aktiv.
- Ein bestätigter Fakt wird nach ausdrücklichem Sir-Signal in den Papierkorb verworfen. Eine
  verworfene Entscheidung bleibt als `revoked` nachvollziehbar.
- Die Historie umfasst auch ersetzte und verworfene Fassungen und weist höchstens eine aktive
  bestätigte Fassung aus. Frühere Fassungen werden niemals still reaktiviert.

## Widerspruchserkennung ab Teilmeilenstein 2.5

- Erst die ausdrückliche Bestätigung eines abweichenden Werts löst die Konfliktprüfung aus;
  ungeprüfte Vorschläge verändern bestätigtes Wissen nicht.
- Die Prüfung verwendet ausschließlich den stabilen `conflictKey`. Ein gleicher Wert unter
  demselben Schlüssel ist kein Widerspruch.
- Ein abweichender Wert markiert die neue und die bisher bestätigte Fassung atomar als `disputed`
  und erzeugt beziehungsweise erweitert einen offenen `MemoryConflict`.
- Eine bestätigte Korrektur des direkten Vorgängers bleibt der kontrollierte Ersetzungsablauf und
  erzeugt allein keinen Konflikt.
- Ein offener Konflikt überschreibt keinen Fakt. Sir kann ausdrücklich einen zugehörigen Fakt
  beibehalten; die übrigen Konfliktfakten werden dann nachvollziehbar `superseded`.
- Verwirft Sir den Fall ausdrücklich als Nicht-Konflikt, werden die beteiligten Fakten wieder
  `confirmed` und der Konflikt als `dismissed` dokumentiert.
- Auflösung, Faktenstatus und Auditspur werden gemeinsam transaktional gespeichert. Fehlende
  Bestätigung, fremde Fakten-IDs, veraltete Revisionen oder unvollständige Zustände rollen die
  gesamte Änderung zurück.

## Strukturierte Suche ab Teilmeilenstein 2.6

- Die Volltextdarstellung wird beim Lesen ausschließlich aus den lokalen Fakten,
  Entscheidungen, Bereichsnamen und Quellenbezeichnungen abgeleitet. Sie ist keine zweite
  Datenquelle.
- Groß-/Kleinschreibung und deutsche Akzentzeichen beeinflussen die Suche nicht; mehrere
  Suchbegriffe müssen gemeinsam im abgeleiteten Text vorkommen.
- Strukturierte Filter begrenzen Treffer nach Bereich, Datensatztyp, Status, einer oder mehreren
  Quellen, Gültigkeit und Änderungszeit.
- Gültigkeit wird am ausdrücklich übergebenen Prüfzeitpunkt als `current`, `future` oder `expired`
  ausgewiesen. Ein unbegrenzter Datensatz ist aktuell.
- Gelöschte Datensätze bleiben standardmäßig ausgeschlossen und werden nur über den ausdrücklichen
  Papierkorbfilter einbezogen.
- Jeder Treffer enthält den Datensatz, den lesbaren Bereich, die verknüpften Quellen und seinen
  Gültigkeitszustand. Die Reihenfolge ist deterministisch nach letzter Änderung und ID.

## Sicherung und Wiederherstellung ab Teilmeilenstein 2.7

- Neue Exporte verwenden ausschließlich `rhia-backup` Formatversion 2 und enthalten alle sieben
  lokalen Sammlungen: Bereiche, Quellen, Notizen, Auditspuren, Fakten, Entscheidungen und
  Gedächtniskonflikte.
- Auch gelöschte, ersetzte, widerrufene und strittige Zustände werden gesichert. Eine Sicherung ist
  keine gefilterte aktive Datenquelle.
- Manifest und Datensatzanzahlen sind versionsspezifisch strikt. SHA-256 schützt den vollständigen
  Inhalt vor unbemerkter Manipulation.
- Gültige v1-Sicherungen bleiben importierbar. Nach erfolgreicher Prüfung werden sie intern auf v2
  migriert; die drei damals nicht vorhandenen Gedächtnissammlungen starten leer.
- Vor der Übernahme werden IDs in allen sieben Sammlungen erneut gegen den aktuellen Speicher
  geprüft. Konflikte blockieren den Standardimport, statt bestehende oder gelöschte Inhalte still
  zu überschreiben.
- Die Übernahme aller sieben Sammlungen erfolgt in einer gemeinsamen Dexie-Transaktion. Ein Fehler
  rollt den vollständigen Import zurück.

## Sicherheits- und Kostengrenze

Stufe 2 speichert keine vollständigen Chats automatisch, verwendet keine externe KI, führt keine
semantische Vektorsuche aus und synchronisiert keine Daten mit einer Cloud. OpenAI bleibt technisch
deaktiviert. IndexedDB bleibt bis Stufe 4 die einzige aktive Datenquelle des jeweiligen Browsers.

## Folgen

Die Gedächtnisregeln sind unabhängig von UI und Speicheradapter testbar. Dexie-Schema,
Repository-Implementierung, Vorschlagsablauf, Konflikterkennung, Suche und Export folgen in den
Teilmeilensteinen 2.2 bis 2.8 und dürfen die hier festgelegten Bestätigungsgrenzen nicht umgehen.
