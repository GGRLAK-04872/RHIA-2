import { describe, expect, it } from "vitest";
import { RHIA_RUNTIME, RHIA_STAGE } from "./index";

describe("RHIA stage boundary", () => {
  it("keeps persistence, cloud and AI disabled in stage 0", () => {
    expect(RHIA_STAGE).toBe(0);
    expect(RHIA_RUNTIME).toEqual({
      sourceOfTruth: "none-yet",
      cloudRuntime: false,
      externalAi: false,
      persistence: false,
    });
  });
});
