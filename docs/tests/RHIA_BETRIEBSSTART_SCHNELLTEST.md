# RHIA-Betriebsstart – Praxisschnelltest durch Sir

**Datum:** 12.08.2026
**Zweck:** letzter realer Schnelltest von Firmen-Cockpit, Erinnerung und einmaliger Mikrofontaste
**Dauer für Sir:** ungefähr 15 bis 25 Minuten
**Testdaten:** ausschließlich künstliche Angaben

## Vorbereitung

1. Den später mitgeteilten Preview-Link in Chrome oder einem Chromium-Browser öffnen.
2. Falls noch eine ältere RHIA-Version erscheint, alle RHIA-Tabs schließen und den Link erneut
   öffnen; notfalls einen privaten Tab verwenden.
3. Version `0.4.1`, Stufe `4`, `IndexedDB` und `OpenAI API deaktiviert` prüfen.
4. Für den Sprachtest ein Mikrofon erlauben. RHIA selbst speichert kein Audio; der Browser kann
   die Sprache jedoch an seinen Anbieter übertragen.

## A – Start und Jahrestag

1. RHIA am 12. August öffnen.
2. Erwartung: Die sichtbare Begrüßung nennt den ersten gemeinsamen Arbeitstag von RH-Produktion,
   Sir als Chef und RHIA als persönliche Assistentin.
3. `Begrüßung anhören` antippen.
4. Erwartung: RHIA spricht den angezeigten Text oder meldet sichtbar, dass der Browser keine
   Sprachausgabe unterstützt.
5. `RHIA starten` antippen.
6. Erwartung: Das Firmen-Cockpit ist die Startansicht.

## B – Firmen-Cockpit und bestätigte Aufgabe

1. Die Bereiche `Nächster sinnvoller Schritt`, `Geld / Geschäft`, `Blockiert`, `Entscheidung von
   Sir` und `Projekte` ansehen.
2. In der Schnelleingabe die Aufgabe `Künstliches Angebot vorbereiten` eintragen.
3. Wichtigkeit `Hoch`, Geldwirkung `Hoch`, erwarteten Eingang `1200`, ein beliebiges zukünftiges
   Datum und die Blockade `Künstliche Testpreise fehlen` eintragen.
4. Erwartung vor der Bestätigung: `Aufgabe bestätigen` ist noch gesperrt.
5. `Ich, Sir, bestätige …` markieren und die Aufgabe speichern.
6. Erwartung: Die Aufgabe erscheint mit verständlicher Prioritätsbegründung, Geldwirkung und
   sichtbarer Blockade.
7. RHIA vollständig schließen und denselben Link neu öffnen.
8. Erwartung: Die künstliche Aufgabe und ihre Blockade sind weiterhin vorhanden.

## C – Mikrofontaste

1. Die Mikrofontaste antippen.
2. Erwartung: Vor dem Zuhören erklärt RHIA, dass nur ein Befehl erfasst, kein Audio von RHIA
   gespeichert und möglicherweise der Browseranbieter beteiligt wird.
3. Zuerst `Abbrechen` wählen. Erwartung: Das Mikrofon startet nicht.
4. Die Mikrofontaste erneut antippen, `Einmalig zuhören` wählen und `Zeige Planung` sagen.
5. Erwartung: Der Mikrofonstatus ist sichtbar; danach öffnet sich `Planung` und RHIA antwortet
   hörbar oder meldet sichtbar eine fehlende Browser-Sprachausgabe.
6. Zur Übersicht zurückkehren. Mikrofontaste erneut freigeben und sagen:
   `Neue Aufgabe künstliches Angebot nachfassen`.
7. Erwartung: Der Text steht nur in der Schnelleingabe. Es wurde noch keine Aufgabe gespeichert.
8. Erwartung: Erst Sirs Haken und `Aufgabe bestätigen` übernehmen sie lokal.
9. Einen unbekannten Satz sprechen, zum Beispiel `Mach einfach alles automatisch`.
10. Erwartung: RHIA führt keine Aktion aus und nennt erlaubte Beispiele.

Wenn die Browser-Spracherkennung nicht verfügbar ist oder keine Berechtigung erhält, muss RHIA
dies sichtbar melden. Dann sind Cockpit und Textbedienung weiter prüfbar, aber Teil C und damit die
Sprachabnahme auf diesem Gerät nicht bestanden. Es darf keinen heimlichen Ersatzdienst geben.

## D – Sicherung und Darstellung

1. `Daten & Sicherung` öffnen und eine Sicherung exportieren.
2. Erwartung: Eine `rhia-backup-YYYY-MM-DD.json` wird heruntergeladen; sie darf nicht in Git oder
   an Dritte weitergegeben werden.
3. Tablet/Handy einmal hochkant und quer drehen.
4. Erwartung: Mikrofontaste, Hauptnavigation und Pflichtaktionen bleiben sichtbar; es gibt keine
   horizontale Überbreite.

## Ergebnis

Bitte anschließend genau eine Rückmeldung geben:

- `BESTANDEN – Betriebsstart freigegeben`, oder
- `NICHT BESTANDEN – Gerät/Browser: … – Schritt: … – Beobachtung: …`.

Dieser Schnelltest erlaubt keinen Merge nach `main`. Dafür bleibt eine weitere ausdrückliche
Freigabe von Sir erforderlich. Das echte Wake-Word wird erst im späteren Sprachaufbau umgesetzt.
