import type { ComponentType } from "react";

export interface RhiaWebGLPresenceProps {
  onReady: () => void;
  onUnavailable: () => void;
}

declare const RhiaWebGLPresence: ComponentType<RhiaWebGLPresenceProps>;

export default RhiaWebGLPresence;
