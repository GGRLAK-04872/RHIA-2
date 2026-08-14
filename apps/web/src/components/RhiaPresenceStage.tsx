import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import styles from "./RhiaWebGLPresence.module.css";
import { RhiaPresenceFallback } from "./RhiaPresenceFallback";

const RhiaWebGLPresence = lazy(() => import("./RhiaWebGLPresence"));

function browserSupportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
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
