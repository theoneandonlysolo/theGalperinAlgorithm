import { TIME_CALIBRATION } from "./config.js";

export function getMassExponent(value) {
  return Math.max(0, value - 1);
}

export function getBigBlockSize(n) {
  const base = 75;
  const exponent = getMassExponent(n);

  let size = base + Math.log10(100 ** exponent) * 12;
  size = Math.max(60, Math.min(size, 220));

  return size;
}

export function createBlocks(n) {
  const size = getBigBlockSize(n);
  const exponent = getMassExponent(n);

  const refBlock = {
    mass: 1,
    x: 50,
    y: 297,
    width: 50,
    height: 50,
    vx: 0,
  };

  const bigBlock = {
    mass: 100 ** exponent,
    x: 420,
    y: 297,
    width: size,
    height: size,
    vx: -100,
  };

  return { refBlock, bigBlock };
}

// integer part of pi * 10^(n-1)
export function collisionCount(n) {
  const exponent = getMassExponent(n);
  return Math.floor(Math.PI * Math.pow(10, exponent));
}

// runtime estimate helpers (same logic, cleaner)
export function estimateSecondsFromCalibration(n) {
  const c1 = collisionCount(2);
  const c2 = collisionCount(3);
  const t1 = TIME_CALIBRATION[2];
  const t2 = TIME_CALIBRATION[3];

  const slope = (t2 - t1) / (c2 - c1);
  const intercept = t1 - slope * c1;

  const seconds = slope * collisionCount(n) + intercept;
  return Math.max(0, seconds);
}

export function humanDuration(seconds) {
  if (!Number.isFinite(seconds)) return "infinite years";
  if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} minutes`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
  if (seconds < 31557600) return `${(seconds / 86400).toFixed(1)} days`;
  return `${(seconds / 31557600).toFixed(1)} years`;
}

export function getBigBlockExponent(value) {
  const exponent = getMassExponent(value);
  const mass = 100 ** exponent;
  if (!Number.isFinite(mass)) return Infinity;
  return Math.floor(Math.log10(mass));
}

export function isPhysicsLimit(value) {
  return !Number.isFinite(getBigBlockExponent(value));
}

/**
 * advance physics by dt seconds, using 1D elastic collisions.
 * mutates simState: { refBlock, bigBlock, collisions }
 */
export function stepPhysics(simState, dt) {
  const { refBlock, bigBlock } = simState;

  // move
  refBlock.x += refBlock.vx * dt;
  bigBlock.x += bigBlock.vx * dt;

  // wall collision
  if (refBlock.x <= 0 && refBlock.vx < 0) {
    refBlock.x = 0;
    refBlock.vx = -refBlock.vx;
    simState.collisions++;
  }

  // block collision
  if (bigBlock.x <= refBlock.x + refBlock.width && bigBlock.vx < refBlock.vx) {
    bigBlock.x = refBlock.x + refBlock.width;

    const m1 = refBlock.mass;
    const m2 = bigBlock.mass;
    const u1 = refBlock.vx;
    const u2 = bigBlock.vx;

    const v1 = ((m1 - m2) / (m1 + m2)) * u1 + (2 * m2 / (m1 + m2)) * u2;
    const v2 = (2 * m1 / (m1 + m2)) * u1 + ((m2 - m1) / (m1 + m2)) * u2;

    refBlock.vx = v1;
    bigBlock.vx = v2;

    simState.collisions++;
  }
}

export function getRightmost(simState) {
  const { refBlock, bigBlock } = simState;
  return Math.max(refBlock.x + refBlock.width, bigBlock.x + bigBlock.width);
}

export function getLeftmost(simState) {
  const { refBlock, bigBlock } = simState;
  return Math.min(refBlock.x + refBlock.width, bigBlock.x + bigBlock.width);
}