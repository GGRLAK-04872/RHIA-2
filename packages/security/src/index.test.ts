import { describe, expect, it } from "vitest";
import { isNetworkTargetAllowed, RHIA_SECURITY_POLICY } from "./index";

describe("stage 1 security boundary", () => {
  it("allows local persistence but no external request or cloud fallback", () => {
    expect(isNetworkTargetAllowed(new URL("https://example.com"))).toBe(false);
    expect(RHIA_SECURITY_POLICY.browserPersistenceAllowed).toBe(true);
    expect(RHIA_SECURITY_POLICY.cloudFallbackAllowed).toBe(false);
    expect(RHIA_SECURITY_POLICY.secretsInClientAllowed).toBe(false);
  });
});
