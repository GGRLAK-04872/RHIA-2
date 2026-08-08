import { describe, expect, it } from "vitest";
import { appStatusSchema } from "./index";

describe("stage 0 app status contract", () => {
  it("accepts only the local, non-persistent stage 0 state", () => {
    const result = appStatusSchema.safeParse({
      version: "0.1.0",
      stage: 0,
      mode: "local-only",
      apiEnabled: false,
      persistenceEnabled: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a prematurely enabled API", () => {
    const result = appStatusSchema.safeParse({
      version: "0.1.0",
      stage: 0,
      mode: "local-only",
      apiEnabled: true,
      persistenceEnabled: false,
    });

    expect(result.success).toBe(false);
  });
});
