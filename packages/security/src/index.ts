export const STAGE_ZERO_SECURITY = {
  externalRequestsAllowed: false,
  secretsInClientAllowed: false,
  personalDataInRepositoryAllowed: false,
  cloudFallbackAllowed: false,
} as const;

export function isStageZeroNetworkTargetAllowed(_target: URL): false {
  return false;
}
