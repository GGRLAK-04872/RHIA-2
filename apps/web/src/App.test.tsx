import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("RHIA stage 4 shell", () => {
  it("stores, edits, deletes and restores a note through the local data view", async () => {
    const user = userEvent.setup();
    render(<App />);

    const startButton = screen.queryByRole("button", { name: "RHIA starten" });
    if (startButton) {
      await user.click(startButton);
    }

    expect(screen.getByRole("heading", { name: "RHIA" })).toBeInTheDocument();
    expect(document.querySelector('[data-rhia-presence-stage="startcockpit"]')).toBeInTheDocument();
    expect(document.querySelector('[data-rhia-presence="fallback"]')).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Übersicht" }));
    await screen.findByRole("heading", { name: "Was ist jetzt wichtig?" });
    expect(screen.getByText("Local-first")).toBeInTheDocument();
    expect(screen.getAllByText("IndexedDB")).toHaveLength(2);
    expect(screen.getByText("OpenAI API deaktiviert")).toBeInTheDocument();
    expect(screen.getByText("Was ist jetzt wichtig?")).toBeInTheDocument();
    expect(screen.getByText("Stufe 4 · lokal")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Kein stiller Rückfall");

    await user.click(screen.getByRole("button", { name: /Mikrofontaste/ }));
    expect(screen.getByRole("dialog", { name: "Sprachfreigabe" })).toHaveTextContent(
      "RHIA speichert kein Audio",
    );
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByRole("dialog", { name: "Sprachfreigabe" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Daten & Sicherung" }));
    expect(screen.getByRole("tabpanel", { name: "Daten & Sicherung" })).toBeVisible();
    await screen.findAllByText("Bereit");
    await user.type(screen.getByRole("textbox", { name: "Bereich" }), "RHIA");
    await user.type(screen.getByRole("textbox", { name: "Titel" }), "Lokaler UI-Test");
    await user.type(screen.getByRole("textbox", { name: "Notiz" }), "Künstliche Testdaten");
    await user.click(screen.getByRole("button", { name: "Lokal speichern" }));

    expect(await screen.findByText("Lokaler UI-Test")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bearbeiten" }));
    const title = screen.getByRole("textbox", { name: "Titel bearbeiten" });
    await user.clear(title);
    await user.type(title, "Bearbeiteter UI-Test");
    await user.click(screen.getByRole("button", { name: "Änderung speichern" }));
    expect(await screen.findByText("Bearbeiteter UI-Test")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Löschen" }));
    expect(await screen.findByRole("button", { name: "Wiederherstellen" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Wiederherstellen" }));
    expect(await screen.findByRole("button", { name: "Löschen" })).toBeInTheDocument();
  }, 20_000);

  it("keeps unfinished form input while navigating through the compact shell", async () => {
    const user = userEvent.setup();
    render(<App />);

    const startButton = screen.queryByRole("button", { name: "RHIA starten" });
    if (startButton) {
      await user.click(startButton);
    }

    await user.click(screen.getByRole("tab", { name: "Gedächtnis" }));
    await screen.findByRole("heading", { name: "Fakten und Entscheidungen" });
    const property = await screen.findByRole(
      "textbox",
      { name: "Eigenschaft" },
      { timeout: 8_000 },
    );
    await user.type(property, "ui-navigation-test");

    await user.click(screen.getByRole("tab", { name: "Planung" }));
    expect(await screen.findByRole("heading", { name: "Begründet planen" })).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Woche" }));
    expect(screen.getByRole("button", { name: "Woche vorschlagen" })).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Briefings" }));
    expect(screen.getByRole("button", { name: "Rückblick erstellen" })).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Feedback" }));
    expect(screen.getByRole("heading", { name: "Planungsfeedback" })).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Gedächtnis" }));
    expect(screen.getByRole("textbox", { name: "Eigenschaft" })).toHaveValue("ui-navigation-test");
  }, 20_000);

  it("takes over a confirmed quick task into the local company cockpit", async () => {
    const user = userEvent.setup();
    render(<App />);

    const startButton = screen.queryByRole("button", { name: "RHIA starten" });
    if (startButton) {
      await user.click(startButton);
    }

    await screen.findByRole("heading", { name: "Was ist jetzt wichtig?" });
    await user.type(screen.getByRole("textbox", { name: "Aufgabe" }), "Angebot vorbereiten");
    await user.selectOptions(screen.getByRole("combobox", { name: "Wichtigkeit" }), "high");
    await user.type(
      screen.getByRole("textbox", { name: "Blockade – optional" }),
      "Lieferantenpreise fehlen",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "Ich, Sir, bestätige die Übernahme dieser Aufgabe.",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Aufgabe bestätigen" }));

    expect(await screen.findByText("„Angebot vorbereiten“ wurde lokal übernommen.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Blockiert" })).toBeVisible();
    expect(screen.getByText("Blockiert: Lieferantenpreise fehlen")).toBeVisible();
  }, 20_000);
});
