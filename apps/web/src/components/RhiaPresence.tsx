import styles from "./RhiaPresence.module.css";

const filaments = [
  "M400 400 C334 332 258 342 190 252 C132 176 94 196 58 118",
  "M400 400 C452 315 526 294 574 206 C608 143 678 146 732 76",
  "M400 400 C465 455 520 462 584 532 C644 596 686 590 760 650",
  "M400 400 C337 472 265 476 214 548 C170 610 104 620 52 706",
  "M400 400 C376 296 400 242 350 158 C315 98 326 70 300 30",
  "M400 400 C488 370 546 388 636 346 C694 318 726 330 786 294",
  "M400 400 C414 496 386 552 430 642 C456 695 438 736 468 790",
  "M400 400 C306 407 250 378 160 414 C102 438 72 422 16 454",
  "M400 400 C302 330 246 224 152 238 C90 246 64 208 18 192",
  "M400 400 C488 286 594 266 652 164 C686 104 728 102 794 50",
  "M400 400 C514 486 594 526 654 626 C688 682 724 714 792 750",
  "M400 400 C292 502 210 530 144 636 C108 694 70 730 10 774",
  "M400 400 C346 376 328 326 278 326 C226 326 204 286 164 282",
  "M400 400 C428 344 474 330 492 278 C512 224 548 204 574 168",
  "M400 400 C456 434 468 482 522 500 C572 516 594 558 628 588",
  "M400 400 C362 438 318 448 298 496 C278 544 238 558 204 588",
  "M400 400 C382 356 402 320 380 278 C360 240 376 202 364 166",
  "M400 400 C446 384 480 404 522 382 C562 362 596 378 636 362",
  "M400 400 C418 446 398 480 420 526 C438 564 426 604 442 642",
  "M400 400 C354 414 320 394 276 414 C236 432 200 416 160 434",
] as const;

const organicRibbons = [
  "M400 400 C344 356 300 300 336 242 C378 176 478 204 496 282 C510 346 456 382 400 400",
  "M400 400 C452 348 522 322 566 370 C622 432 574 524 492 530 C430 532 410 468 400 400",
  "M400 400 C452 454 468 520 416 560 C350 610 270 542 282 458 C290 406 350 390 400 400",
  "M400 400 C350 454 286 474 240 428 C190 378 226 290 310 278 C364 270 392 338 400 400",
  "M400 400 C368 334 376 258 442 238 C518 214 570 296 536 364 C514 410 452 414 400 400",
  "M400 400 C472 390 534 416 536 480 C538 550 450 578 394 532 C352 498 370 442 400 400",
  "M400 400 C374 470 324 516 262 488 C190 456 204 362 272 326 C328 296 376 350 400 400",
  "M400 400 C330 390 280 346 300 282 C324 206 424 194 468 258 C502 310 454 370 400 400",
] as const;

const orbitPaths = [
  "M58 456 C104 218 374 66 640 142 C734 168 790 232 786 306",
  "M112 246 C286 86 590 122 724 344 C780 438 760 538 684 620",
  "M116 602 C46 424 170 218 380 156 C552 106 716 194 766 354",
  "M176 722 C368 798 650 690 730 520 C770 436 754 366 710 304",
] as const;

const neuralBloom = Array.from({ length: 72 }, (_, index) => {
  const angle = index * 2.399963 + (index % 5) * 0.11;
  const length = 112 + ((index * 47) % 224);
  const direction = index % 2 === 0 ? 1 : -1;
  const bend = direction * (0.36 + (index % 7) * 0.045);
  const flatten = 0.86 + (index % 4) * 0.035;
  const point = (pointAngle: number, radius: number) =>
    `${(400 + Math.cos(pointAngle) * radius).toFixed(1)} ${(400 + Math.sin(pointAngle) * radius * flatten).toFixed(1)}`;

  const start = point(angle, 12 + (index % 8) * 1.8);
  const controlOne = point(angle + bend * 0.24, length * (0.19 + (index % 4) * 0.025));
  const controlTwo = point(angle + bend * 0.74, length * (0.55 + (index % 3) * 0.05));
  const end = point(angle + bend * (1.08 + (index % 5) * 0.055), length);

  return `M${start} C${controlOne} ${controlTwo} ${end}`;
});

const neuralLinks = [
  "M190 252 C244 206 304 222 350 158",
  "M258 342 C282 288 326 266 364 166",
  "M526 294 C558 352 604 378 636 346",
  "M574 206 C626 230 648 282 710 304",
  "M584 532 C526 576 482 602 430 642",
  "M654 626 C590 640 534 618 468 690",
  "M214 548 C278 586 330 558 337 472",
  "M144 636 C188 596 198 548 214 548",
  "M160 414 C206 370 226 352 278 326",
  "M52 706 C114 670 132 626 144 636",
] as const;

const anchorNodes = [
  [400, 400, 8],
  [334, 332, 3],
  [258, 342, 2.4],
  [190, 252, 2.8],
  [452, 315, 2.5],
  [526, 294, 3],
  [574, 206, 2.2],
  [465, 455, 3],
  [584, 532, 2.8],
  [337, 472, 2.6],
  [214, 548, 2.2],
  [376, 296, 2.1],
  [636, 346, 2.8],
  [430, 642, 2.3],
  [160, 414, 2.7],
  [652, 164, 2.5],
  [654, 626, 2.3],
  [144, 636, 2.4],
] as const;

const ambientNodes = Array.from({ length: 58 }, (_, index) => {
  const angle = index * 2.39996 + 0.34;
  const radius = 126 + ((index * 53) % 258);
  return {
    x: 400 + Math.cos(angle) * radius,
    y: 400 + Math.sin(angle) * radius * 0.88,
    radius: 0.8 + (index % 5) * 0.34,
  };
});

export function RhiaPresence() {
  return (
    <div className={styles.presence} data-rhia-presence="spatial">
      <div className={styles.farHalo} />
      <div className={styles.depthMist} />
      <svg className={styles.web} viewBox="0 0 800 800" aria-hidden="true">
        <defs>
          <radialGradient id="rhia-filament-gradient" cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor="#fff8fb" />
            <stop offset="9%" stopColor="#ff8db8" />
            <stop offset="45%" stopColor="#f32676" stopOpacity="0.94" />
            <stop offset="82%" stopColor="#9b113f" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6a092e" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="rhia-orbit-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#76102f" stopOpacity="0" />
            <stop offset="42%" stopColor="#dc2868" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#ff6097" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#76102f" stopOpacity="0" />
          </linearGradient>
          <filter id="rhia-near-glow" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="2.3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="rhia-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <g className={styles.orbits}>
          {orbitPaths.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>
        <g className={styles.farParticles}>
          {ambientNodes.map((node, index) => (
            <circle
              key={`${node.x}-${node.y}`}
              cx={node.x}
              cy={node.y}
              r={node.radius}
              data-depth={index % 3}
            />
          ))}
        </g>
        <g className={styles.ribbons}>
          {organicRibbons.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>
        <g className={styles.bloom}>
          {neuralBloom.map((path, index) => (
            <path key={path} d={path} data-depth={index % 4} />
          ))}
        </g>
        <g className={styles.filaments}>
          {filaments.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>
        <g className={styles.links}>
          {neuralLinks.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>
        <g className={styles.nodes}>
          {anchorNodes.map(([cx, cy, radius]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={radius} />
          ))}
        </g>
        <circle className={styles.coreAura} cx="400" cy="400" r="42" />
        <circle className={styles.coreRing} cx="400" cy="400" r="20" />
        <circle className={styles.coreLight} cx="400" cy="400" r="9" />
      </svg>
      <div className={styles.lensFlare} />
    </div>
  );
}
