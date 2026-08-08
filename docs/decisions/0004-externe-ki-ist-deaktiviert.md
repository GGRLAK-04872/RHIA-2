# ADR 0004: Externe KI ist in Stufe 0 deaktiviert

- Status: angenommen
- Datum: 08.08.2026

## Entscheidung

Der vorhandene OpenAI-API-Schlüssel ist für Work derzeit nicht als `OPENAI_API_KEY` erreichbar. Es
wird kein neuer Schlüssel erstellt. RHIA 2.0 startet vollständig lokal ohne KI-Aufruf.

## Folgen

Der Browser enthält weder SDK noch API-Endpunkt noch Schlüssel. Eine spätere Einbindung benötigt
einen serverseitigen Dienst, sichere Schlüsselablage, sichtbare Kostengrenzen und einen eigenen
Abnahmeschritt. Diese Entscheidung blockiert Stufe 0 nicht.
