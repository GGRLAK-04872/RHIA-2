import type { CSSProperties } from "react";
import styles from "./RhiaPresence.module.css";

const orbitPaths = [
  "M72 430 C132 196 348 90 596 128 C742 150 834 250 842 372",
  "M92 316 C226 114 528 76 740 224 C846 298 864 418 808 532",
  "M112 530 C156 676 358 746 590 690 C736 654 822 566 844 458",
  "M152 642 C336 746 644 688 774 498 C842 398 822 304 756 230",
] as const;

const particles = Array.from({ length: 44 }, (_, index) => {
  const angle = index * 2.399963 + 0.41;
  const radius = 118 + ((index * 61) % 296);
  const depth = index % 3;

  return {
    x: 450 + Math.cos(angle) * radius,
    y: 382 + Math.sin(angle) * radius * 0.73,
    radius: 0.75 + depth * 0.48,
    depth,
    delay: `${-((index * 0.71) % 8).toFixed(2)}s`,
  };
});

export function RhiaPresence() {
  return (
    <div className={styles.presence} data-rhia-presence="spatial">
      <div className={styles.farGlow} />
      <div className={styles.mistBack} />

      <svg
        className={styles.orbitField}
        viewBox="0 0 900 800"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rhia-orbit-light" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#68102f" stopOpacity="0" />
            <stop offset="34%" stopColor="#d72e72" stopOpacity="0.5" />
            <stop offset="62%" stopColor="#ff79ad" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#68102f" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="rhia-particle-light">
            <stop offset="0%" stopColor="#fff5fb" />
            <stop offset="28%" stopColor="#ff77ad" />
            <stop offset="100%" stopColor="#e0236d" stopOpacity="0" />
          </radialGradient>
          <filter id="rhia-particle-glow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className={styles.rearOrbits}>
          {orbitPaths.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>

        <g className={styles.particles}>
          {particles.map((particle) => (
            <circle
              key={`${particle.x}-${particle.y}`}
              cx={particle.x}
              cy={particle.y}
              r={particle.radius}
              data-depth={particle.depth}
              style={{ animationDelay: particle.delay } as CSSProperties}
            />
          ))}
        </g>

        <g className={styles.frontOrbits}>
          <path d="M126 482 C250 626 572 686 790 518" />
          <path d="M192 216 C396 112 702 168 820 350" />
        </g>
      </svg>

      <div className={styles.brainStage}>
        <div className={styles.brainAura} />
        <img
          className={styles.brainImage}
          src={`${import.meta.env.BASE_URL}rhia-neural-brain-v1.webp`}
          alt=""
          draggable="false"
        />
        <div className={styles.brainLight} />
      </div>

      <div className={styles.mistFront} />
      <div className={styles.floorProjection}>
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
