export const RHIA_SECURITY_POLICY = {
  externalRequestsAllowed: false,
  browserPersistenceAllowed: true,
  secretsInClientAllowed: false,
  personalDataInRepositoryAllowed: false,
  cloudFallbackAllowed: false,
} as const;

export function isNetworkTargetAllowed(_target: URL): false {
  return false;
}
