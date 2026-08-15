import { createContext, type ReactNode, useContext } from "react";
import type { RhiaStartStatus } from "../application/rhiaStartStatus";

const RhiaStartStatusContext = createContext<RhiaStartStatus | null>(null);

export function RhiaStartStatusProvider({
  children,
  status,
}: {
  children: ReactNode;
  status: RhiaStartStatus;
}) {
  return (
    <RhiaStartStatusContext.Provider value={status}>{children}</RhiaStartStatusContext.Provider>
  );
}

export function useRhiaStartStatus(): RhiaStartStatus {
  const status = useContext(RhiaStartStatusContext);
  if (!status) {
    throw new Error("RHIA_START_STATUS_MISSING");
  }
  return status;
}
