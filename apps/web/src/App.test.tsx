import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("RHIA stage 0 shell", () => {
  it("shows the local-only state and disabled integrations", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "RHIA 2.0" })).toBeInTheDocument();
    expect(screen.getByText("Nur lokal")).toBeInTheDocument();
    expect(screen.getByText("Deaktiviert")).toBeInTheDocument();
    expect(screen.getByText("Nicht verbunden")).toBeInTheDocument();
    expect(screen.getByText("Ab Stufe 1")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Kein stiller Rückfall");
  });
});
