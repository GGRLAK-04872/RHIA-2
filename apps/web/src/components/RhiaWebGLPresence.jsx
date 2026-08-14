"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./RhiaWebGLPresence.module.css";

const TAU = Math.PI * 2;

function mulberry32(seed) {
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random, min, max) {
  return min + (max - min) * random();
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("RHIA glow texture could not be created.");
  }
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,.94)");
  gradient.addColorStop(0.12, "rgba(255,244,255,.88)");
  gradient.addColorStop(0.32, "rgba(255,177,232,.5)");
  gradient.addColorStop(0.64, "rgba(191,91,177,.15)");
  gradient.addColorStop(1, "rgba(82,18,74,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const mistVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aPhase;
  attribute float aDensity;
  attribute float aTint;
  attribute float aStretch;
  attribute float aAngle;
  varying float vPhase;
  varying float vDensity;
  varying float vTint;
  varying float vStretch;
  varying float vAngle;

  void main() {
    vec3 moved = position;
    float slow = uTime * 0.055;
    moved.x += sin(slow + aPhase * 8.7 + position.y * 1.8) * (0.055 + aDensity * 0.04);
    moved.y += cos(slow * 0.83 + aPhase * 7.1 + position.x * 1.5) * (0.045 + aDensity * 0.032);
    moved.z += sin(slow * 0.61 + aPhase * 11.3) * (0.055 + aDensity * 0.03);

    vec4 viewPosition = modelViewMatrix * vec4(moved, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float breathing = 0.94 + 0.06 * sin(uTime * 0.075 + aPhase * 9.0);
    gl_PointSize = min(420.0, aSize * breathing * uPixelRatio * (8.35 / max(1.0, -viewPosition.z)));
    vPhase = aPhase;
    vDensity = aDensity;
    vTint = aTint;
    vStretch = aStretch;
    vAngle = aAngle;
  }
`;

const mistFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  varying float vPhase;
  varying float vDensity;
  varying float vTint;
  varying float vStretch;
  varying float vAngle;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.55;
    for (int i = 0; i < 3; i++) {
      value += noise(p) * amplitude;
      p = p * 2.07 + vec2(4.1, 7.3);
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float cosine = cos(vAngle);
    float sine = sin(vAngle);
    uv = mat2(cosine, -sine, sine, cosine) * uv;
    uv.y /= vStretch;
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float edge = 0.86
      + sin(angle * 3.0 + vPhase * 12.0) * 0.075
      + sin(angle * 5.0 - vPhase * 8.0) * 0.045
      + sin(angle * 7.0 + vPhase * 4.0) * 0.025;
    float radial = smoothstep(edge, 0.04, radius);
    vec2 flow = uv * 2.25 + vec2(
      uTime * 0.012 + vPhase * 7.0,
      -uTime * 0.009 + vPhase * 4.0
    );
    float vapor = fbm(flow);
    float wisps = smoothstep(0.16, 0.78, vapor * 0.82 + radial * 0.58);
    float body = smoothstep(0.015, 0.74, radial) * (0.5 + vapor * 0.5);
    float alpha = radial * mix(body, wisps, 0.42) * vDensity * uOpacity;
    if (alpha < 0.001) discard;

    vec3 violet = vec3(0.48, 0.25, 0.6);
    vec3 paleMagenta = vec3(1.0, 0.64, 0.91);
    vec3 color = mix(violet, paleMagenta, clamp(vTint + vapor * 0.22, 0.0, 1.0));
    color = mix(color, vec3(1.0, 0.78, 0.96), radial * vapor * 0.18);
    gl_FragColor = vec4(color, alpha);
  }
`;

const pointVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aPhase;
  attribute float aWarm;
  varying float vWarm;
  varying float vPulse;

  void main() {
    float pulseA = 0.52 + 0.48 * sin(uTime * (0.72 + mod(aPhase, 0.47)) + aPhase * 9.0);
    float pulseB = pow(max(0.0, sin(uTime * 0.19 + aPhase * 17.0)), 10.0);
    vPulse = pulseA * 0.48 + pulseB * 0.52;
    vWarm = aWarm;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = min(28.0, aSize * (0.72 + vPulse * 0.55) * uPixelRatio * (8.8 / max(1.0, -viewPosition.z)));
  }
`;

const pointFragmentShader = `
  varying float vWarm;
  varying float vPulse;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float radius = length(center) * 2.0;
    float core = smoothstep(0.23, 0.0, radius);
    float halo = smoothstep(1.0, 0.04, radius) * 0.55;
    float sparkle = pow(max(0.0, 1.0 - abs(center.x) * 10.0), 3.0)
      + pow(max(0.0, 1.0 - abs(center.y) * 10.0), 3.0);
    vec3 magenta = vec3(0.96, 0.43, 0.8);
    vec3 gold = vec3(1.0, 0.52, 0.18);
    vec3 color = mix(magenta, gold, vWarm);
    color = mix(color, vec3(1.0, 0.92, 1.0), core * 0.9);
    float alpha = (halo + core * 0.9 + sparkle * 0.08 * vPulse) * (0.48 + vPulse * 0.52);
    if (radius > 1.0) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

const lineVertexShader = `
  uniform float uTime;
  attribute float aPhase;
  attribute float aEnergy;
  attribute float aDepth;
  varying float vPhase;
  varying float vEnergy;
  varying float vDepth;

  void main() {
    vPhase = aPhase;
    vEnergy = aEnergy;
    vDepth = aDepth;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lineFragmentShader = `
  uniform float uTime;
  varying float vPhase;
  varying float vEnergy;
  varying float vDepth;

  void main() {
    float life = 0.5 + 0.5 * sin(uTime * (0.12 + vEnergy * 0.06) + vPhase);
    life = smoothstep(0.06, 0.48, life) * (1.0 - smoothstep(0.78, 0.98, life));
    float shimmer = 0.68 + 0.32 * sin(uTime * 0.42 + vPhase * 3.7);
    float depthGlow = mix(0.66, 1.12, vDepth);
    float alpha = (0.105 + life * 0.36) * shimmer * depthGlow;
    vec3 backColor = vec3(0.48, 0.22, 0.58);
    vec3 frontColor = vec3(1.0, 0.76, 0.97);
    vec3 color = mix(backColor, frontColor, clamp(vEnergy * 0.6 + vDepth * 0.48, 0.0, 1.0));
    gl_FragColor = vec4(color, alpha);
  }
`;

const particleVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aPhase;
  attribute float aDepth;
  varying float vAlpha;

  void main() {
    vec3 moved = position;
    moved.x += sin(uTime * (0.025 + aDepth * 0.018) + aPhase * 7.0) * (0.07 + aDepth * 0.09);
    moved.y += cos(uTime * (0.021 + aDepth * 0.013) + aPhase * 9.0) * (0.055 + aDepth * 0.07);
    moved.z += sin(uTime * 0.017 + aPhase * 11.0) * 0.045;
    vec4 viewPosition = modelViewMatrix * vec4(moved, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = aSize * uPixelRatio * (6.5 / max(1.0, -viewPosition.z));
    vAlpha = (0.26 + 0.28 * sin(uTime * 0.15 + aPhase * 13.0)) * (0.45 + aDepth * 0.55);
  }
`;

const particleFragmentShader = `
  varying float vAlpha;

  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    if (radius > 1.0) discard;
    float alpha = smoothstep(1.0, 0.0, radius) * max(0.03, vAlpha);
    vec3 color = mix(vec3(0.62, 0.12, 0.52), vec3(1.0, 0.59, 0.88), alpha);
    gl_FragColor = vec4(color, alpha);
  }
`;

const MIST_ANCHORS = [
  { center: [-1.28, 0.62, -0.18], scale: [1.22, 0.8, 0.72] },
  { center: [-0.42, 1.0, -0.3], scale: [1.32, 0.72, 0.8] },
  { center: [0.48, 0.96, -0.22], scale: [1.24, 0.74, 0.76] },
  { center: [1.25, 0.54, -0.1], scale: [1.14, 0.84, 0.7] },
  { center: [-1.5, -0.06, -0.02], scale: [0.9, 0.96, 0.64] },
  { center: [-0.62, 0.12, 0.18], scale: [1.26, 1.1, 0.74] },
  { center: [0.38, 0.12, 0.28], scale: [1.34, 1.12, 0.78] },
  { center: [1.48, -0.08, 0.06], scale: [0.88, 1.0, 0.64] },
  { center: [-0.86, -0.7, -0.1], scale: [0.92, 0.76, 0.6] },
  { center: [0.12, -0.7, 0.12], scale: [1.12, 0.82, 0.66] },
  { center: [0.82, -0.56, -0.02], scale: [0.86, 0.72, 0.56] },
  { center: [0.0, -1.4, -0.14], scale: [0.4, 0.72, 0.42] },
];

function sampleCloudPoint(random, spread = 1) {
  const anchor = MIST_ANCHORS[Math.floor(random() * MIST_ANCHORS.length)];
  const vector = new THREE.Vector3();
  do {
    vector.set(
      randomBetween(random, -1, 1),
      randomBetween(random, -1, 1),
      randomBetween(random, -1, 1),
    );
  } while (vector.lengthSq() > 1);

  vector.multiply(new THREE.Vector3(...anchor.scale).multiplyScalar(spread));
  vector.add(new THREE.Vector3(...anchor.center));
  vector.x += Math.sin(vector.y * 2.8 + vector.z) * 0.13;
  vector.y += Math.cos(vector.x * 2.3 - vector.z * 0.8) * 0.105;
  vector.z += Math.sin(vector.x * 1.7 + vector.y * 2.1) * 0.08;
  return vector;
}

function makeNodeField() {
  const random = mulberry32(20774);
  const nodes = [];
  const phases = [];
  const sizes = [];
  const warm = [];
  const innerCount = 640;

  while (nodes.length < innerCount) {
    const vector = sampleCloudPoint(random, 0.9);
    nodes.push(vector);
    phases.push(random() * TAU);
    sizes.push(randomBetween(random, 3.6, 8.2) * (random() > 0.96 ? 1.3 : 1));
    warm.push(random() > 0.98 ? 1 : 0);
  }

  const connections = [];
  for (let i = 0; i < innerCount; i += 1) {
    const candidates = [];
    for (let j = i + 1; j < innerCount; j += 1) {
      const distance = nodes[i].distanceToSquared(nodes[j]);
      if (distance < 0.56) candidates.push({ j, distance });
    }
    candidates.sort((a, b) => a.distance - b.distance);
    const limit = random() > 0.38 ? 7 : 6;
    for (const candidate of candidates.slice(0, limit)) {
      if (random() > 0.07) connections.push([i, candidate.j]);
    }
  }

  const outerStarts = nodes
    .map((node, index) => ({ index, radius: Math.hypot(node.x * 0.82, node.y) }))
    .filter(({ radius }) => radius > 1.05);

  for (let tendril = 0; tendril < 30; tendril += 1) {
    const startIndex = outerStarts[Math.floor(random() * outerStarts.length)].index;
    const start = nodes[startIndex];
    const direction = new THREE.Vector3(start.x * 0.8, start.y, start.z * 0.45)
      .normalize()
      .add(
        new THREE.Vector3(
          randomBetween(random, -0.34, 0.34),
          randomBetween(random, -0.34, 0.34),
          randomBetween(random, -0.18, 0.18),
        ),
      )
      .normalize();

    let previousIndex = startIndex;
    const segments = 4 + Math.floor(random() * 4);
    for (let step = 0; step < segments; step += 1) {
      const previous = nodes[previousIndex];
      const point = previous.clone().addScaledVector(direction, 0.21 + step * 0.026);
      point.x += Math.sin(tendril * 1.7 + step * 0.9) * 0.055;
      point.y += Math.cos(tendril * 1.3 + step * 0.8) * 0.048;
      point.z += Math.sin(tendril * 0.8 + step) * 0.035;
      const nextIndex = nodes.length;
      nodes.push(point);
      phases.push(random() * TAU);
      sizes.push(randomBetween(random, 3.8, 7.4));
      warm.push(0);
      connections.push([previousIndex, nextIndex]);
      previousIndex = nextIndex;
    }
  }

  return { nodes, phases, sizes, warm, connections };
}

function createMistLayer(config, pixelRatio) {
  const random = mulberry32(config.seed);
  const positions = new Float32Array(config.count * 3);
  const sizes = new Float32Array(config.count);
  const phases = new Float32Array(config.count);
  const densities = new Float32Array(config.count);
  const tints = new Float32Array(config.count);
  const stretches = new Float32Array(config.count);
  const angles = new Float32Array(config.count);

  for (let index = 0; index < config.count; index += 1) {
    const point = sampleCloudPoint(random, config.spread);
    point.z += config.depthBias;
    point.toArray(positions, index * 3);
    sizes[index] = randomBetween(random, config.sizeMin, config.sizeMax);
    phases[index] = random();
    densities[index] = randomBetween(random, 0.55, 1);
    tints[index] = Math.min(1, Math.max(0, config.tintBias + randomBetween(random, -0.16, 0.2)));
    stretches[index] = randomBetween(random, config.stretchMin ?? 0.5, config.stretchMax ?? 0.94);
    angles[index] = random() * TAU;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aDensity", new THREE.BufferAttribute(densities, 1));
  geometry.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
  geometry.setAttribute("aStretch", new THREE.BufferAttribute(stretches, 1));
  geometry.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: config.opacity },
    },
    vertexShader: mistVertexShader,
    fragmentShader: mistFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
}

function createParticleLayer(count, seed, spread, depthBias, pixelRatio) {
  const random = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const depths = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const radius = random() ** 0.72 * spread;
    const theta = random() * TAU;
    const phi = Math.acos(randomBetween(random, -1, 1));
    positions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius * 1.22;
    positions[index * 3 + 1] = Math.cos(phi) * radius * 0.86;
    positions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius * 0.68 + depthBias;
    sizes[index] = randomBetween(random, 1.7, 5.4);
    phases[index] = random();
    depths[index] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aDepth", new THREE.BufferAttribute(depths, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

export default function RhiaWebGLPresence({ onReady, onUnavailable }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50);
    camera.position.set(0, 0.02, 7.45);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        premultipliedAlpha: false,
      });
    } catch {
      mount.dataset.webglUnavailable = "true";
      onUnavailable();
      return undefined;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const presence = new THREE.Group();
    presence.scale.set(1.25, 1.05, 1);
    presence.position.y = 0.08;
    scene.add(presence);

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const mistLayers = [
      createMistLayer(
        {
          count: 60,
          seed: 296,
          spread: 1.18,
          depthBias: -0.98,
          sizeMin: 196,
          sizeMax: 350,
          opacity: 0.125,
          tintBias: 0.2,
          stretchMin: 0.42,
          stretchMax: 0.82,
        },
        pixelRatio,
      ),
      createMistLayer(
        {
          count: 75,
          seed: 404,
          spread: 1.12,
          depthBias: -0.72,
          sizeMin: 176,
          sizeMax: 318,
          opacity: 0.15,
          tintBias: 0.28,
          stretchMin: 0.45,
          stretchMax: 0.86,
        },
        pixelRatio,
      ),
      createMistLayer(
        {
          count: 90,
          seed: 512,
          spread: 1.04,
          depthBias: -0.46,
          sizeMin: 154,
          sizeMax: 286,
          opacity: 0.175,
          tintBias: 0.38,
          stretchMin: 0.48,
          stretchMax: 0.9,
        },
        pixelRatio,
      ),
      createMistLayer(
        {
          count: 96,
          seed: 628,
          spread: 0.96,
          depthBias: -0.16,
          sizeMin: 132,
          sizeMax: 252,
          opacity: 0.195,
          tintBias: 0.5,
          stretchMin: 0.5,
          stretchMax: 0.94,
        },
        pixelRatio,
      ),
      createMistLayer(
        {
          count: 84,
          seed: 744,
          spread: 0.88,
          depthBias: 0.14,
          sizeMin: 114,
          sizeMax: 218,
          opacity: 0.185,
          tintBias: 0.62,
          stretchMin: 0.48,
          stretchMax: 0.92,
        },
        pixelRatio,
      ),
      createMistLayer(
        {
          count: 64,
          seed: 866,
          spread: 0.82,
          depthBias: 0.44,
          sizeMin: 98,
          sizeMax: 186,
          opacity: 0.16,
          tintBias: 0.68,
          stretchMin: 0.46,
          stretchMax: 0.88,
        },
        pixelRatio,
      ),
      createMistLayer(
        {
          count: 46,
          seed: 978,
          spread: 1.0,
          depthBias: 0.76,
          sizeMin: 82,
          sizeMax: 160,
          opacity: 0.11,
          tintBias: 0.56,
          stretchMin: 0.42,
          stretchMax: 0.84,
        },
        pixelRatio,
      ),
      createMistLayer(
        {
          count: 30,
          seed: 1094,
          spread: 1.08,
          depthBias: 1.02,
          sizeMin: 72,
          sizeMax: 142,
          opacity: 0.075,
          tintBias: 0.46,
          stretchMin: 0.4,
          stretchMax: 0.8,
        },
        pixelRatio,
      ),
    ];
    const mistLayerSpeeds = [0.62, 0.73, 0.84, 0.96, 1.08, 1.17, 1.26, 1.34];
    mistLayers.forEach((layer) => {
      presence.add(layer);
    });

    const backParticles = createParticleLayer(560, 841, 3.9, -0.94, pixelRatio);
    const midParticles = createParticleLayer(430, 932, 3.16, 0.0, pixelRatio);
    const frontParticles = createParticleLayer(280, 1023, 2.62, 0.9, pixelRatio);
    backParticles.material.uniforms.uPixelRatio.value = pixelRatio * 0.68;
    frontParticles.material.uniforms.uPixelRatio.value = pixelRatio * 1.25;
    presence.add(backParticles, midParticles, frontParticles);

    const field = makeNodeField();
    const animatedNodes = field.nodes.map((node) => node.clone());
    const nodePositions = new Float32Array(field.nodes.length * 3);
    for (let index = 0; index < field.nodes.length; index += 1) {
      field.nodes[index].toArray(nodePositions, index * 3);
    }
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    nodeGeometry.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(field.sizes), 1));
    nodeGeometry.setAttribute(
      "aPhase",
      new THREE.BufferAttribute(new Float32Array(field.phases), 1),
    );
    nodeGeometry.setAttribute("aWarm", new THREE.BufferAttribute(new Float32Array(field.warm), 1));
    const nodeMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const nodePoints = new THREE.Points(nodeGeometry, nodeMaterial);
    presence.add(nodePoints);

    const linePositions = new Float32Array(field.connections.length * 6);
    const linePhases = new Float32Array(field.connections.length * 2);
    const lineEnergy = new Float32Array(field.connections.length * 2);
    const lineDepth = new Float32Array(field.connections.length * 2);
    const lineRandom = mulberry32(7719);
    for (let index = 0; index < field.connections.length; index += 1) {
      const [startIndex, endIndex] = field.connections[index];
      animatedNodes[startIndex].toArray(linePositions, index * 6);
      animatedNodes[endIndex].toArray(linePositions, index * 6 + 3);
      const phase = lineRandom() * TAU;
      const energy = randomBetween(lineRandom, 0.15, 1);
      const depth = THREE.MathUtils.clamp(
        ((animatedNodes[startIndex].z + animatedNodes[endIndex].z) * 0.5 + 1.7) / 3.4,
        0,
        1,
      );
      linePhases[index * 2] = phase;
      linePhases[index * 2 + 1] = phase;
      lineEnergy[index * 2] = energy;
      lineEnergy[index * 2 + 1] = energy;
      lineDepth[index * 2] = depth;
      lineDepth[index * 2 + 1] = depth;
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("aPhase", new THREE.BufferAttribute(linePhases, 1));
    lineGeometry.setAttribute("aEnergy", new THREE.BufferAttribute(lineEnergy, 1));
    lineGeometry.setAttribute("aDepth", new THREE.BufferAttribute(lineDepth, 1));
    const lineMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: lineVertexShader,
      fragmentShader: lineFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    presence.add(lines);

    const impulseRandom = mulberry32(4271);
    const impulseCount = 76;
    const impulsePositions = new Float32Array(impulseCount * 3);
    const impulseSizes = new Float32Array(impulseCount);
    const impulsePhases = new Float32Array(impulseCount);
    const impulseWarm = new Float32Array(impulseCount);
    const impulses = Array.from({ length: impulseCount }, (_, index) => ({
      edgeIndex: Math.floor(impulseRandom() * field.connections.length),
      speed: randomBetween(impulseRandom, 0.035, 0.092),
      offset: impulseRandom(),
      direction: impulseRandom() > 0.5 ? 1 : -1,
      index,
    }));
    impulses.forEach((_impulse, index) => {
      impulseSizes[index] = randomBetween(impulseRandom, 6.5, 11.5);
      impulsePhases[index] = impulseRandom() * TAU;
      impulseWarm[index] = impulseRandom() > 0.94 ? 1 : 0;
    });
    const impulseGeometry = new THREE.BufferGeometry();
    impulseGeometry.setAttribute("position", new THREE.BufferAttribute(impulsePositions, 3));
    impulseGeometry.setAttribute("aSize", new THREE.BufferAttribute(impulseSizes, 1));
    impulseGeometry.setAttribute("aPhase", new THREE.BufferAttribute(impulsePhases, 1));
    impulseGeometry.setAttribute("aWarm", new THREE.BufferAttribute(impulseWarm, 1));
    const impulseMaterial = nodeMaterial.clone();
    impulseMaterial.uniforms = THREE.UniformsUtils.clone(nodeMaterial.uniforms);
    const impulsePoints = new THREE.Points(impulseGeometry, impulseMaterial);
    presence.add(impulsePoints);

    let glowTexture;
    try {
      glowTexture = makeGlowTexture();
    } catch {
      renderer.dispose();
      renderer.domElement.remove();
      onUnavailable();
      return undefined;
    }
    const coreGroup = new THREE.Group();
    coreGroup.position.set(-0.02, 0.2, 0.36);
    presence.add(coreGroup);
    const coreSprites = [
      { position: [-0.12, 0.06, 0.2], size: 0.82, opacity: 0.36, color: 0xffffff, phase: 0.0 },
      { position: [0.13, -0.03, 0.17], size: 0.98, opacity: 0.31, color: 0xfff4fd, phase: 0.56 },
      { position: [-0.22, -0.08, 0.12], size: 1.22, opacity: 0.25, color: 0xffd9f2, phase: 1.12 },
      { position: [0.2, 0.12, 0.08], size: 1.46, opacity: 0.21, color: 0xffbde8, phase: 1.68 },
      { position: [-0.05, 0.16, 0.02], size: 1.76, opacity: 0.165, color: 0xf3a5dc, phase: 2.24 },
      { position: [0.08, -0.12, -0.04], size: 2.08, opacity: 0.13, color: 0xe389d1, phase: 2.8 },
      { position: [-0.2, 0.04, -0.1], size: 2.5, opacity: 0.095, color: 0xcf69bf, phase: 3.36 },
      { position: [0.2, 0.02, -0.16], size: 2.94, opacity: 0.07, color: 0xb852aa, phase: 3.92 },
      { position: [-0.08, -0.04, -0.22], size: 3.42, opacity: 0.048, color: 0x9e448f, phase: 4.48 },
      { position: [0.04, 0.05, -0.28], size: 3.9, opacity: 0.03, color: 0x79336e, phase: 5.04 },
    ].map((config) => {
      const material = new THREE.SpriteMaterial({
        map: glowTexture,
        color: config.color,
        opacity: config.opacity,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.fromArray(config.position);
      sprite.scale.setScalar(config.size);
      sprite.userData.baseSize = config.size;
      sprite.userData.baseOpacity = config.opacity;
      sprite.userData.basePosition = sprite.position.clone();
      sprite.userData.phase = config.phase;
      coreGroup.add(sprite);
      return sprite;
    });

    const clock = new THREE.Clock();
    let animationFrame = 0;
    let lastRender = 0;
    let isVisible = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetFrameDuration = 1000 / 40;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const currentRatio = renderer.getPixelRatio();
      nodeMaterial.uniforms.uPixelRatio.value = currentRatio;
      impulseMaterial.uniforms.uPixelRatio.value = currentRatio;
      backParticles.material.uniforms.uPixelRatio.value = currentRatio * 0.68;
      midParticles.material.uniforms.uPixelRatio.value = currentRatio;
      frontParticles.material.uniforms.uPixelRatio.value = currentRatio * 1.25;
      mistLayers.forEach((layer) => {
        layer.material.uniforms.uPixelRatio.value = currentRatio;
      });
    };
    resize();
    renderer.render(scene, camera);
    onReady();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion) renderer.render(scene, camera);
    });
    resizeObserver.observe(mount);

    const handleVisibility = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible) clock.start();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleContextLost = (event) => {
      event.preventDefault();
      onUnavailable();
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    const impulsePoint = new THREE.Vector3();
    const animate = (now) => {
      animationFrame = requestAnimationFrame(animate);
      if (!isVisible || now - lastRender < targetFrameDuration) return;
      lastRender = now;
      const elapsed = clock.getElapsedTime();

      mistLayers.forEach((layer, index) => {
        layer.material.uniforms.uTime.value = elapsed * mistLayerSpeeds[index] + index * 3.1;
      });

      for (let index = 0; index < field.nodes.length; index += 1) {
        const base = field.nodes[index];
        const phase = field.phases[index];
        const radial = 1 + Math.sin(elapsed * 0.12 + phase) * 0.012;
        animatedNodes[index].set(
          base.x * radial + Math.sin(elapsed * 0.16 + phase * 2.1) * 0.018,
          base.y * radial + Math.cos(elapsed * 0.13 + phase * 1.7) * 0.015,
          base.z + Math.sin(elapsed * 0.11 + phase * 2.8) * 0.024,
        );
        animatedNodes[index].toArray(nodePositions, index * 3);
      }
      nodeGeometry.attributes.position.needsUpdate = true;

      for (let index = 0; index < field.connections.length; index += 1) {
        const [startIndex, endIndex] = field.connections[index];
        animatedNodes[startIndex].toArray(linePositions, index * 6);
        animatedNodes[endIndex].toArray(linePositions, index * 6 + 3);
      }
      lineGeometry.attributes.position.needsUpdate = true;

      impulses.forEach((impulse, index) => {
        const [startIndex, endIndex] = field.connections[impulse.edgeIndex];
        let progress = (elapsed * impulse.speed + impulse.offset) % 1;
        if (impulse.direction < 0) progress = 1 - progress;
        const eased = progress * progress * (3 - 2 * progress);
        impulsePoint.copy(animatedNodes[startIndex]).lerp(animatedNodes[endIndex], eased);
        impulsePoint.toArray(impulsePositions, index * 3);
      });
      impulseGeometry.attributes.position.needsUpdate = true;

      nodeMaterial.uniforms.uTime.value = elapsed;
      impulseMaterial.uniforms.uTime.value = elapsed * 1.35;
      lineMaterial.uniforms.uTime.value = elapsed;
      backParticles.material.uniforms.uTime.value = elapsed * 0.72 + 1.7;
      midParticles.material.uniforms.uTime.value = elapsed * 0.91 + 5.4;
      frontParticles.material.uniforms.uTime.value = elapsed * 1.08 + 9.2;

      const pulsePrimary = 1 + Math.sin(elapsed * 0.58) * 0.035;
      const pulseSecondary = 1 + Math.sin(elapsed * 0.23 + 1.6) * 0.02;
      coreSprites.forEach((sprite, index) => {
        const phase = sprite.userData.phase;
        const ripple =
          1 + Math.sin(elapsed * (0.42 - index * 0.025) - phase) * (0.025 + index * 0.008);
        const size = sprite.userData.baseSize * pulsePrimary * pulseSecondary * ripple;
        sprite.scale.setScalar(size);
        sprite.position.x =
          sprite.userData.basePosition.x + Math.sin(elapsed * 0.09 + phase) * 0.012;
        sprite.position.y =
          sprite.userData.basePosition.y + Math.cos(elapsed * 0.075 + phase) * 0.01;
        sprite.material.opacity =
          sprite.userData.baseOpacity * (0.9 + Math.sin(elapsed * 0.52 - phase) * 0.1);
      });

      renderer.render(scene, camera);
    };

    if (!reducedMotion) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      mount.dataset.reducedMotion = "true";
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            material.dispose();
          });
        }
      });
      glowTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady, onUnavailable]);

  return (
    <div className={styles.mount} ref={mountRef} data-rhia-presence="webgl" aria-hidden="true" />
  );
}
