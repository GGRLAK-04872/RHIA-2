import { createArea, createBriefing, createWorkBlock } from "@rhia/domain";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LocalPlanningSnapshot } from "../application/localPlanningService";
import { PlanningPanel } from "./PlanningPanel";

const timestamp = "2026-08-10T08:00:00.000Z";
const area = createArea(
  { name: "RHIA" },
  { id: "11111111-1111-4111-8111-111111111111", timestamp },
);
const briefing = createBriefing(
  {
    kind: "morning",
    periodStart: "2026-08-10T00:00:00.000Z",
    periodEnd: "2026-08-11T00:00:00.000Z",
    availableMinutes: 120,
    plannedMinutes: 60,
    protectionMinutes: 60,
    title: "Künstliches Morgenbriefing",
    summary: "Ein Block, 60 von 120 Minuten geplant.",
    explanation: "Frist und Schutzzeit sind sichtbar begründet.",
    generatedAt: timestamp,
  },
  { id: "22222222-2222-4222-8222-222222222222", timestamp },
);
const block = createWorkBlock(
  {
    briefingId: briefing.id,
    taskId: null,
    areaId: area.id,
    kind: "protection",
    title: "Künstliche RHIA-Schutzzeit",
    startAt: "2026-08-10T09:00:00.000Z",
    endAt: "2026-08-10T10:00:00.000Z",
    durationMinutes: 60,
    explanation: "Verbindliche Schutzzeit.",
  },
  { id: "33333333-3333-4333-8333-333333333333", timestamp },
);

function snapshot(): LocalPlanningSnapshot {
  return {
    workspace: { areas: [area], tasks: [], dependencies: [], workBlocks: [block], feedback: [] },
    briefings: [briefing],
    workBlocks: [block],
    feedback: [],
    trash: { briefings: [], workBlocks: [], feedback: [] },
  };
}

describe("stage 4 planning panel", () => {
  it("creates plan requests and records structured feedback", async () => {
    const user = userEvent.setup();
    const onGeneratePlan = vi.fn(async () => {});
    const onRecordFeedback = vi.fn(async () => {});
    render(
      <PlanningPanel
        snapshot={snapshot()}
        onGeneratePlan={onGeneratePlan}
        onCreateEveningReview={vi.fn(async () => {})}
        onRecordFeedback={onRecordFeedback}
        onTrashBriefing={vi.fn(async () => {})}
        onRestoreBriefing={vi.fn(async () => {})}
      />,
    );

    expect(screen.getByRole("heading", { name: "Begründet planen" })).toBeInTheDocument();
    expect(screen.getByText("Künstliche RHIA-Schutzzeit")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tagesplan vorschlagen" }));
    expect(onGeneratePlan).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "morning", availability: expect.any(Array) }),
    );

    await user.selectOptions(
      screen.getByLabelText("Ergebnis für Künstliche RHIA-Schutzzeit"),
      "partial",
    );
    await user.selectOptions(
      screen.getByLabelText("Grund für Künstliche RHIA-Schutzzeit"),
      "time-too-short",
    );
    await user.type(
      screen.getByLabelText("Tatsächliche Minuten für Künstliche RHIA-Schutzzeit"),
      "30",
    );
    await user.click(screen.getByRole("button", { name: "Rückmeldung speichern" }));
    expect(onRecordFeedback).toHaveBeenCalledWith({
      workBlockId: block.id,
      result: "partial",
      reason: "time-too-short",
      actualMinutes: 30,
      note: null,
    });
  });
});
