import { describe, expect, it } from "vitest";
import { isStageZeroNetworkTargetAllowed, STAGE_ZERO_SECURITY } from "./index";

describe("stage 0 security boundary", () => {
  it("allows no external network target", () => {
    expect(isStageZeroNetworkTargetAllowed(new URL("https://example.com"))).toBe(false);
    expect(STAGE_ZERO_SECURITY.cloudFallbackAllowed).toBe(false);
  });
});
