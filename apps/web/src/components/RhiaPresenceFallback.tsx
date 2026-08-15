import styles from "./RhiaWebGLPresence.module.css";

const fallbackConnections = [
  "M118 280 C202 164 310 170 402 266 C486 354 570 322 686 206",
  "M94 360 C204 314 258 220 382 232 C508 244 560 374 704 340",
  "M128 450 C240 398 288 520 416 480 C536 442 596 384 720 450",
  "M164 532 C246 438 350 586 460 516 C558 454 620 528 682 582",
  "M222 172 C282 274 274 364 354 424 C424 478 416 570 470 638",
  "M602 142 C542 244 560 316 478 378 C400 436 380 520 306 630",
  "M86 242 C202 250 218 354 330 350 C452 346 480 198 624 230",
  "M118 576 C238 536 268 420 384 442 C500 466 536 610 688 570",
  "M302 116 C330 226 410 242 412 354 C414 466 348 526 382 656",
  "M508 128 C476 224 508 292 456 366 C404 442 456 526 514 622",
  "M162 338 C250 364 290 294 374 312 C462 330 510 414 626 388",
  "M186 474 C268 430 326 456 390 406 C458 354 526 438 648 500",
] as const;

const fallbackNodes = [
  [118, 280, 2.2],
  [202, 164, 2.8],
  [310, 170, 2.2],
  [402, 266, 3.2],
  [570, 322, 2.6],
  [686, 206, 2.2],
  [94, 360, 2],
  [258, 220, 2.6],
  [382, 232, 2.4],
  [704, 340, 2.2],
  [128, 450, 2.4],
  [288, 520, 2.8],
  [416, 480, 2.3],
  [596, 384, 2.8],
  [720, 450, 2.1],
  [164, 532, 2.2],
  [350, 586, 2.5],
  [460, 516, 2.8],
  [682, 582, 2.1],
  [222, 172, 2.2],
  [354, 424, 2.8],
  [470, 638, 2.4],
  [602, 142, 2.2],
  [478, 378, 2.7],
  [306, 630, 2.1],
  [384, 405, 4.3],
] as const;

export function RhiaPresenceFallback({ hidden = false }: { hidden?: boolean }) {
  return (
    <div
      className={styles.fallback}
      data-hidden={hidden || undefined}
      data-rhia-presence="fallback"
      aria-hidden="true"
    >
      <svg viewBox="0 0 800 760" preserveAspectRatio="xMidYMid meet">
        <title>Statische RHIA Presence</title>
        <defs>
          <radialGradient id="rhia-fallback-mist">
            <stop offset="0%" stopColor="#f7a8dc" stopOpacity="0.3" />
            <stop offset="42%" stopColor="#c53e9f" stopOpacity="0.17" />
            <stop offset="100%" stopColor="#4c123f" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="rhia-fallback-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#6f2a76" stopOpacity="0.24" />
            <stop offset="45%" stopColor="#ff9ed2" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#b73091" stopOpacity="0.18" />
          </linearGradient>
          <radialGradient id="rhia-fallback-core">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="12%" stopColor="#ffd7f0" stopOpacity="0.88" />
            <stop offset="38%" stopColor="#ed7bc5" stopOpacity="0.44" />
            <stop offset="100%" stopColor="#9b247d" stopOpacity="0" />
          </radialGradient>
          <filter id="rhia-fallback-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="34" />
          </filter>
          <filter id="rhia-fallback-glow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="rhia-fallback-core-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <g className={styles.fallbackMist}>
          <ellipse cx="268" cy="282" rx="176" ry="132" />
          <ellipse cx="488" cy="276" rx="188" ry="142" />
          <ellipse cx="218" cy="438" rx="148" ry="136" />
          <ellipse cx="438" cy="438" rx="210" ry="168" />
          <ellipse cx="600" cy="430" rx="126" ry="132" />
          <ellipse cx="392" cy="565" rx="96" ry="124" />
        </g>
        <g className={styles.fallbackLines}>
          {fallbackConnections.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>
        <g className={styles.fallbackNodes}>
          {fallbackNodes.map(([cx, cy, radius]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={radius} />
          ))}
        </g>
        <circle className={styles.fallbackCore} cx="396" cy="390" r="54" />
      </svg>
    </div>
  );
}
