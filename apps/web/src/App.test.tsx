import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("RHIA stage 1 shell", () => {
  it("stores, edits, deletes and restores a note through the local data view", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "RHIA 2.0" })).toBeInTheDocument();
    expect(screen.getByText("Local-first")).toBeInTheDocument();
    expect(screen.getByText("IndexedDB")).toBeInTheDocument();
    expect(screen.getByText("Deaktiviert")).toBeInTheDocument();
    expect(screen.getByText("Nicht verbunden")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Kein stiller Rückfall");

    await screen.findByText("Bereit");
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
});
