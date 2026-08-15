import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { RhiaPresenceFallback } from "./RhiaPresenceFallback";
import styles from "./RhiaWebGLPresence.module.css";

const RhiaWebGLPresence = lazy(() => import("./RhiaWebGLPresence"));

function browserSupportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context =
      window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl"));
    const supported = Boolean(context);
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return supported;
  } catch {
    return false;
  }
}

export function RhiaPresenceStage() {
  const [webGLAvailable, setWebGLAvailable] = useState(false);
  const [webGLReady, setWebGLReady] = useState(false);

  useEffect(() => {
    setWebGLAvailable(browserSupportsWebGL());
  }, []);

  const handleReady = useCallback(() => {
    setWebGLReady(true);
  }, []);

  const handleUnavailable = useCallback(() => {
    setWebGLReady(false);
    setWebGLAvailable(false);
  }, []);

  return (
    <div className={styles.stage} data-rhia-presence-stage="startcockpit" aria-hidden="true">
      <RhiaPresenceFallback hidden={webGLReady} />
      {webGLAvailable ? (
        <Suspense fallback={null}>
          <RhiaWebGLPresence onReady={handleReady} onUnavailable={handleUnavailable} />
        </Suspense>
      ) : null}
    </div>
  );
}
