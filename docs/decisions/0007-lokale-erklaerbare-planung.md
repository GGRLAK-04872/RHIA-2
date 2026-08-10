# ADR 0007: Planung bleibt lokal, deterministisch und erklärbar

- Status: angenommen
- Datum: 10.08.2026
- Gültig ab: Stufe 4

## Kontext

RHIA soll aus den bereits lokal gespeicherten Aufgaben, Fristen, Abhängigkeiten und ausdrücklich
angegebener verfügbarer Zeit brauchbare Tages- und Wochenvorschläge bilden. In Stufe 4 existieren
weder Kalenderanbindung noch externe KI oder zentrale Datenquelle. Ein Vorschlag darf deshalb
weder einen nicht vorhandenen Termin erfinden noch eine externe Änderung ausführen.

## Entscheidung

Stufe 4 führt `WorkBlock`, `Briefing` und `PlanningFeedback` als versionierte lokale Entitäten ein.
Die Planung läuft ausschließlich als deterministischer Domänendienst:

- Eingaben sind aktive lokale Aufgaben und Abhängigkeiten, deren lokale Fristen, vorhandene
  Planungsrückmeldungen sowie von Sir eingegebene Verfügbarkeitsfenster.
- Blockierte, erledigte, verworfene oder durch eine letzte Rückmeldung als erledigt beziehungsweise
  blockiert markierte Aufgaben werden nicht vorgeschlagen.
- Die bestehende erklärbare Priorisierung bleibt maßgeblich: Frist, Wichtigkeit, Blockade,
  Geldwirkung, realistischer früher Geldeingang, Aufwand und Schutzzeit. Eine ausdrücklich
  bestätigte manuelle Rangfolge bleibt geschützt.
- Jeder Arbeitsblock enthält Zeitraum, Dauer, Bereich, optionale Aufgabe, Status und eine sichtbare
  Begründung. Ein Briefing enthält Zeitraum, verfügbare, geplante und geschützte Minuten sowie die
  verwendete Reihenfolge der Kriterien.
- Die Wochenplanung reserviert ungefähr 20 Prozent der verfügbaren Projektzeit. Sie verlangt
  mindestens 60 Minuten für RHIA und 60 Minuten für Shadow Grown; zusammenhängende 60 Minuten
  werden bevorzugt, ansonsten werden 30-Minuten-Blöcke verwendet. Weniger als 120 verfügbare
  Wochenminuten werden sichtbar abgelehnt.
- Morgenbriefings runden die ungefähr 20 Prozent Schutzzeit auf bedienbare 15-Minuten-Einheiten.
  Die verbindlichen wöchentlichen Mindestblöcke werden durch die Wochenplanung durchgesetzt.
- Sir erfasst Rückmeldungen strukturiert als erledigt, teilweise erledigt oder ausgelassen, mit
  Grund, tatsächlicher Dauer und optionaler Notiz. Nur die jeweils jüngste aktive Rückmeldung einer
  Aufgabe beeinflusst den Folgevorschlag.
- Teilweise erledigte oder zu kurz bemessene Blöcke werden im Folgevorschlag höher beziehungsweise
  länger angesetzt. Zu lange Blöcke werden verkürzt. Falsche Priorität wird herabgestuft. Erledigte
  oder blockierte Rückmeldungen schließen die Aufgabe aus, bis ihr lokaler Arbeitszustand geändert
  wird.
- Der Abendrückblick fasst die lokalen Rückmeldungen des gewählten Tages zusammen. Er verändert
  keine Aufgabe und führt keine externe Aktion aus.

## Daten- und Integritätsgrenzen

- IndexedDB bleibt die einzige aktive Geschäftsdatenquelle des jeweiligen Browsers.
- Aufgabenfristen sind die in Stufe 3 vorhandenen lokalen `Task.dueAt`-Werte. Stufe 4 führt keinen
  externen Kalender und keine zweite Termindatenbank ein.
- Dexie-Version 5 ergänzt die drei Stufe-4-Tabellen additiv. Daten der Stufen 1 bis 3 bleiben
  erhalten.
- Neue Sicherungen verwenden `rhia-backup` Version 4 und enthalten alle 14 Sammlungen. Gültige
  Sicherungen der Versionen 1, 2 und 3 werden geprüft und ohne erfundene Stufe-4-Daten migriert.
- Briefing, zugehörige Arbeitsblöcke und Rückmeldungen werden gemeinsam in den Papierkorb verschoben
  und gemeinsam wiederhergestellt. Revisionsschutz, Auditspur, SHA-256-Prüfung und Konfliktschutz
  bleiben wirksam.
- Es gibt keinen Netzaufruf, keine externe KI, keine Kalenderänderung, keine Synchronisation und
  keine laufenden API-Kosten.

## Folgen

Vorschläge sind reproduzierbar, lokal prüfbar und für Sir begründet. Die technische Fertigstellung
genügt noch nicht zur endgültigen Abnahme: Erst fünf aufeinanderfolgende, von Sir bestätigte
Alltagstests dürfen Stufe 4 abschließen. Stufe 5 bleibt bis dahin vollständig gesperrt.
