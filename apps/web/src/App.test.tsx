import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("RHIA stage 4 shell", () => {
  it("stores, edits, deletes and restores a note through the local data view", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "RHIA" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Übersicht" }));
    expect(screen.getByText("Local-first")).toBeInTheDocument();
    expect(screen.getAllByText("IndexedDB")).toHaveLength(2);
    expect(screen.getByText("Deaktiviert")).toBeInTheDocument();
    expect(screen.getByText("Nicht verbunden")).toBeInTheDocument();
    expect(screen.getByText("Stufe 4 · lokal")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Kein stiller Rückfall");

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
  });

  it("keeps unfinished form input while navigating through the compact shell", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Gedächtnis" }));
    await screen.findByRole("heading", { name: "Fakten und Entscheidungen" });
    const property = await screen.findByRole("textbox", { name: "Eigenschaft" });
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
  });
});
