# RHIA 2.0 – Projektstand

Stand: 09.08.2026

## Aktuelle Stufe

Stufe 1 – Local-first-Datenfundament ist vollständig abgeschlossen, von Sir am 09.08.2026 nach
bestandenem Tablet- und Handytest abgenommen und durch den Squash-Merge von PR #1 in `main`
integriert. Der Dokumentationsnachtrag aus PR #2 ist ebenfalls gemergt und veröffentlicht.

Ausgangs-`main` für Stufe 2: `7578f79e627f9e0d298c734bba3040f9fef93049`.

Stufe 2 – Gedächtnis v1 wurde am 09.08.2026 ausdrücklich freigegeben. Teilmeilenstein 2.0 ist grün;
Teilmeilenstein 2.1 ist auf `feat/stufe-2-gedaechtnis-v1` umgesetzt und über GitHub-CI bestätigt.
Teilmeilenstein 2.2 ist mit der additiven Dexie-Migration und den Gedächtnis-Repositories umgesetzt
und über GitHub-CI bestätigt. Teilmeilenstein 2.3 ist mit dem kontrollierten Vorschlags-,
Bestätigungs- und Ablehnungsablauf umgesetzt und über GitHub-CI bestätigt. Teilmeilenstein 2.4 ist
mit Korrektur-, Ersetzungs-, Verwerfungs- und Historienabläufen umgesetzt und über GitHub-CI
bestätigt. Teilmeilenstein 2.5 ist mit stabiler Widerspruchserkennung und kontrollierter
Konfliktauflösung umgesetzt und lokal vollständig grün. Stufe 2 ist noch nicht abgeschlossen oder
zur Zusammenführung freigegeben. Teilmeilenstein 2.6 ist mit strukturierter lokaler Suche umgesetzt
und lokal vollständig grün.

## Umgesetzt

- verbindlicher RHIA-2.0-Masterplan;
- TypeScript-Monorepository mit React/Vite-PWA und gemeinsamen Paketen;
- strikt lokale App-Shell ohne Datenbank, Cloud-Laufzeit oder KI-Aufruf;
- sichtbare Fehlergrenze ohne versteckte Ersatzquelle;
- Unit-, Komponenten- und Browser-Smoke-Testbasis;
- CI, Secret-Scan und Audit des öffentlichen Builds;
- Altcode-Audit mit Übernahme- und Archivmatrix;
- ADRs für Architektur, Quelle der Wahrheit und Cloud-Abgrenzung.
- lokale Kernprüfung bestanden: 6 Tests, Build, PWA, HTTP-Smoke und 0 bekannte
  Produktionsabhängigkeitslücken.
- öffentlicher Codebestand ausschließlich in `GGRLAK-04872/RHIA-2` veröffentlicht;
- GitHub CI einschließlich Chromium-Browser-Smoke bestanden;
- getrennte GitHub-Pages-Testadresse erfolgreich bereitgestellt;
- Android-Praxistest durch Sir bestanden;
- OpenAI API weiterhin deaktiviert; keine API-Aufrufe oder API-Kosten;
- altes Repository `RHIA` unverändert.
- versionierte Basistypen und Zod-Verträge für `Area`, `Source`, `Note` und `AuditEntry`;
- Dexie-/IndexedDB-Repositories als einzige lokale Datenquelle;
- UUIDs, Revisionen, Zeitstempel und sichtbare Fehlercodes;
- CRUD, Cross-Table-Transaktionen und optimistischer Konfliktschutz;
- getestete Migration künstlicher Version-1-Altdaten;
- versionierter JSON-Export mit SHA-256 und validierter Importvorschau;
- Importkonflikte blockieren stilles Überschreiben;
- 30-Tage-Papierkorb, Wiederherstellung und bestätigte Gesamtlöschung;
- responsive lokale Notizansicht mit Sicherungs- und Löschfunktionen.
- realer Tablet- und Handytest einschließlich Bearbeiten, Neustartpersistenz, Papierkorb,
  Wiederherstellung, Export, Gesamtlöschung, gültigem Import und Ablehnung einer ungültigen
  Sicherung bestanden;
- Handyansicht im Hoch- und Querformat real geprüft;
- Stufe 1 am 09.08.2026 durch Sir abgenommen und über PR #1 in `main` integriert.
- Gedächtnisverträge für `MemoryFact`, `Decision` und `MemoryConflict` mit strikter
  Laufzeitvalidierung;
- Dexie-Tabellen und typisierte Repositories für alle drei Gedächtnisentitäten;
- gemeinsame Transaktionen über die vier Stufe-1- und drei Gedächtnistabellen;
- Revisionsschutz, Löschung und sichere Wiederherstellung als unbestätigter Vorschlag;
- verlustfreie Migration vom veröffentlichten Stufe-1-Schema auf die neuen Gedächtnistabellen;
- Dexie-Version 3 statt der verkürzten Planangabe Version 2, weil Version 2 bereits das
  veröffentlichte Stufe-1-Schema ist;
- Sicherungsformat v1 bleibt bis zum ausdrücklich vorgesehenen Teilmeilenstein 2.7 unverändert.
- Fakten und Entscheidungen entstehen technisch ausschließlich als inaktive Vorschläge;
- Aktivierung nur durch ausdrückliche Bestätigung von Sir mit Zeitstempel und Auditspur;
- Ablehnung ausschließlich offener Vorschläge mit sicherem Übergang in den 30-Tage-Papierkorb;
- ungültige oder wiederholte Zustandswechsel werden sichtbar blockiert;
- Bereichs- und Quellenbezüge werden transaktional geprüft; fehlerhafte Vorschläge hinterlassen
  weder Gedächtnisdatensatz noch Auditspur.
- Korrekturen erzeugen eine neue inaktive Fassung mit kontrolliertem `supersedesId`;
- bestätigte Vorgänger bleiben bis zur ausdrücklichen Bestätigung ihrer Korrektur aktiv;
- Bestätigung ersetzt Vorgänger und Korrektur atomar; Revisionsfehler rollen beide Änderungen
  vollständig zurück;
- verworfene Korrekturen ändern die aktive Fassung nicht;
- bestätigte Fakten können ausdrücklich in den Papierkorb verworfen und Entscheidungen
  nachvollziehbar widerrufen werden;
- vollständige Fassungshistorie einschließlich ersetzter und verworfener Fassungen mit höchstens
  einer aktiven bestätigten Fassung.
- stabile Konflikterkennung über `conflictKey`, ohne automatische Überschreibung;
- widersprüchliche bestätigte Werte werden gemeinsam `disputed` und in einem offenen
  `MemoryConflict` sichtbar;
- ausdrückliche Auflösung durch Beibehalten eines Fakts oder Verwerfen als Nicht-Konflikt;
- atomare Aktualisierung von Faktenstatus, Konfliktstatus und Auditspur mit Revisionsschutz.
- abgeleitete lokale Volltextsuche ohne zweite Datenquelle oder externen Dienst;
- strukturierte Filter nach Bereich, Typ, Status, Quelle, Gültigkeit und Änderungszeit;
- normalisierte Suche einschließlich deutscher Akzentzeichen mit deterministischer Reihenfolge;
- Treffer zeigen Bereich, Quellen und aktuellen Gültigkeitszustand nachvollziehbar an.

## Nächster notwendiger Schritt

1. Teilmeilenstein 2.6 vollständig lokal prüfen und als isolierten Commit festhalten.
2. Danach Teilmeilenstein 2.7 mit Sicherungsformat v2 und erhaltener v1-Migration umsetzen.
3. Stufe 2 erst nach vollständiger technischer und realer Abnahme zusammenführen.

OpenAI API, Sprache, Android-App und Cloud-Sync bleiben deaktiviert. Das alte Repository `RHIA`
bleibt unverändert.
