import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRhiaBrowserStorage, type RhiaBrowserStorage } from "@rhia/storage-browser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalMemoryService } from "../application/localMemoryService";
import { MemoryPanel } from "./MemoryPanel";

let storage: RhiaBrowserStorage;
let service: LocalMemoryService;

beforeEach(() => {
  storage = createRhiaBrowserStorage({
    databaseName: `rhia-memory-panel-test-${crypto.randomUUID()}`,
  });
  service = new LocalMemoryService({ storage });
});

afterEach(async () => {
  await storage.deleteDatabase();
});

describe("responsive memory panel", () => {
  it("runs the visible fact proposal, confirmation, correction, deletion and restore flow", async () => {
    const user = userEvent.setup();
    render(<MemoryPanel service={service} />);

    await screen.findByText("Bereit");
    await user.type(screen.getByRole("textbox", { name: "Eigenschaft" }), "preferred-address");
    await user.type(
      screen.getByRole("textbox", { name: "Konfliktschlüssel" }),
      "sir.profile.preferred-address",
    );
    await user.type(screen.getByRole("textbox", { name: "Wert" }), "Sir");
    await user.type(
      screen.getByRole("textbox", { name: "Verständliche Anzeige" }),
      "Die bevorzugte Anrede ist Sir.",
    );
    await user.click(screen.getByRole("button", { name: "Als Vorschlag speichern" }));

    expect(await screen.findByText("Die bevorzugte Anrede ist Sir.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bestätigen" }));
    await user.click(await screen.findByRole("button", { name: "Korrigieren" }));
    const correctedValue = screen.getByRole("textbox", { name: "Korrigierter Wert" });
    const correctedDisplay = screen.getByRole("textbox", { name: "Korrigierte Anzeige" });
    await user.clear(correctedValue);
    await user.type(correctedValue, "Sir, privat Mike");
    await user.clear(correctedDisplay);
    await user.type(correctedDisplay, "Die bevorzugte Anrede ist Sir, privat Mike.");
    await user.click(screen.getByRole("button", { name: "Korrektur vorschlagen" }));
    const correctedTitle = await screen.findByText("Die bevorzugte Anrede ist Sir, privat Mike.");
    const correctedCard = correctedTitle.closest("li");
    if (!correctedCard) {
      throw new Error("Die erwartete Korrekturkarte fehlt.");
    }

    await user.click(await screen.findByRole("button", { name: "Bestätigen" }));
    await user.click(await within(correctedCard).findByRole("button", { name: "Verwerfen" }));
    await user.click(
      await within(correctedCard).findByRole("button", { name: "Als Vorschlag wiederherstellen" }),
    );
    expect(await screen.findByRole("button", { name: "Bestätigen" })).toBeInTheDocument();
  });

  it("creates a decision and filters the local result list by text and type", async () => {
    const user = userEvent.setup();
    render(<MemoryPanel service={service} />);

    await screen.findByText("Bereit");
    await user.selectOptions(screen.getByRole("combobox", { name: "Eintragstyp" }), "decision");
    await user.type(
      screen.getByRole("textbox", { name: "Entscheidungstitel" }),
      "OpenAI deaktiviert lassen",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Entscheidung" }),
      "OpenAI bleibt in Stufe 2 deaktiviert.",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Begründung" }),
      "Das Gedächtnis arbeitet vollständig lokal.",
    );
    await user.click(screen.getByRole("button", { name: "Als Vorschlag speichern" }));

    expect(await screen.findByText("OpenAI deaktiviert lassen")).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Gedächtnis durchsuchen" }), "openai");
    await user.selectOptions(screen.getByRole("combobox", { name: "Typ" }), "decision");
    await user.click(screen.getByRole("button", { name: "Filter anwenden" }));

    expect(await screen.findByText("1 Treffer · 0 offene Konflikte")).toBeInTheDocument();
    expect(screen.getByText("OpenAI deaktiviert lassen")).toBeInTheDocument();
  });
});
