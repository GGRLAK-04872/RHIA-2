import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { validRhiaStartStatus } from "../application/rhiaStartStatus.test";
import { RhiaStartStatusError } from "../application/rhiaStartStatus";
import { RhiaStartGate } from "./RhiaStartGate";

describe("RHIA start gate", () => {
  it("shows the app only after the start status was loaded", async () => {
    const loader = vi.fn(async () => validRhiaStartStatus);
    render(
      <RhiaStartGate loader={loader}>
        <p>RHIA Arbeitsoberfläche</p>
      </RhiaStartGate>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Startstatus wird geladen");
    expect(await screen.findByText("RHIA Arbeitsoberfläche")).toBeVisible();
  });

  it("shows a visible error and retries without a fallback", async () => {
    const user = userEvent.setup();
    const loader = vi
      .fn<() => Promise<typeof validRhiaStartStatus>>()
      .mockRejectedValueOnce(new RhiaStartStatusError("unavailable"))
      .mockResolvedValueOnce(validRhiaStartStatus);

    render(
      <RhiaStartGate loader={loader}>
        <p>RHIA Arbeitsoberfläche</p>
      </RhiaStartGate>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Die zentrale Startdatei ist nicht verfügbar.",
    );
    expect(screen.queryByText("RHIA Arbeitsoberfläche")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Startdatei erneut laden" }));
    expect(await screen.findByText("RHIA Arbeitsoberfläche")).toBeVisible();
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
