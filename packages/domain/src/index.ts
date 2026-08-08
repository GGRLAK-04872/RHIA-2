export const RHIA_PRODUCT_NAME = "RHIA 2.0" as const;
export const RHIA_VERSION = "0.1.0" as const;
export const RHIA_STAGE = 0 as const;

export const RHIA_RUNTIME = {
  sourceOfTruth: "none-yet",
  cloudRuntime: false,
  externalAi: false,
  persistence: false,
} as const;

export type RhiaRuntime = typeof RHIA_RUNTIME;
