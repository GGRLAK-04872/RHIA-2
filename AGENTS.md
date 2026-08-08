# RHIA 2.0 – verbindliche Arbeitsregeln

Diese Regeln gelten für alle automatisierten und menschlichen Änderungen in diesem Repository.

1. Der intern freigegebene RHIA-2-Masterplan bestimmt Architektur, Reihenfolge und Abnahme.
2. Arbeite nur innerhalb der aktuell freigegebenen Stufe. Beginne keine spätere Stufe vor der
   dokumentierten Abnahme durch Sir.
3. Melde Fehler sofort sichtbar. Verwende niemals eine versteckte Ersatz-Datenquelle.
4. Secrets, persönliche Daten, Exporte, Datenbanken, Backups und Audio gehören nicht in Git, Logs,
   Browserbuilds oder Chat-Ausgaben.
5. OpenAI- und andere externe API-Schlüssel dürfen ausschließlich serverseitig aus einer sicheren
   Laufzeitumgebung gelesen werden. Sie dürfen nie mit `VITE_` beginnen.
6. Cloudflare Workers, Pages Functions, KV, Durable Objects, Wrangler und `rhia.pages.dev` sind keine
   Laufzeitbestandteile von RHIA 2.0.
7. Externe Aktionen folgen den Freigabestufen A–D. Änderungen an Ziel, Empfänger, Betrag oder Inhalt
   machen eine neue Freigabe erforderlich.
8. Vor einem Commit müssen mindestens `pnpm check` und die zur Änderung passenden Tests bestehen.
9. Aktualisiere bei einer abgeschlossenen Änderung Projektstand, relevante ADRs und Abnahmetests.
10. Das alte Repository wird nur lesend auditiert. Nichts dort löschen, mergen oder veröffentlichen.
