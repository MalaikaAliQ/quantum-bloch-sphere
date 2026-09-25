/* =========================================================================
   QUANTUM BLOCH SIMULATION SUITE - STATE MANAGEMENT
   ========================================================================= */

import { useCallback, useRef, useSyncExternalStore } from 'react';

// Primary qubit state
const initialQState = {
  theta: 0,
  phi: 0,
  radius: 1.0,
  targetTheta: 0,
  targetPhi: 0,
  targetRadius: 1.0,
  isAnimating: false,
  progress: 0,
  startTheta: 0,
  startPhi: 0,
  startRadius: 1.0,
};

// Target qubit for kickback
const initialTargetState = {
  theta: Math.PI,
  phi: 0,
  radius: 1.0,
};

let qState = { ...initialQState };
let qTargetState = { ...initialTargetState };
let activeModule = 'standard';
let isLarmorRunning = false;
let larmorTime = 0;
let larmorFrame = 'rotating';
let isWeakMeasuring = false;
let weakMeasureInterval = null;
let showTrails = true;
let showProjections = true;
let animSpeed = 1.5;
let kickbackStep = 1;
// Change listeners Set
const listeners = new Set();
// Prevent aggressive tree‑shaking removal
void listeners;

// State snapshot cache for referential equality in useSyncExternalStore
let cachedSnapshot = null;

function getSnapshot() {
  if (!cachedSnapshot) {
    cachedSnapshot = {
      qState: { ...qState },
      qTargetState: { ...qTargetState },
      activeModule,
      isLarmorRunning,
      larmorTime,
      larmorFrame,
      isWeakMeasuring,
      showTrails,
      showProjections,
      animSpeed,
      kickbackStep,
    };
  }
  return cachedSnapshot;
}

function emitChange() {
  cachedSnapshot = null;
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---- Actions ----

export function setActiveModule(mod) {
  activeModule = mod;
  if (mod !== 'kickback') {
    // Reset camera handled in scene
  }
  if (mod === 'kickback') {
    execKickbackStep(1);
  }
  emitChange();
}

export function setAnimSpeed(v) {
  animSpeed = v;
  emitChange();
}

export function setShowTrails(v) {
  showTrails = v;
  emitChange();
}

export function setShowProjections(v) {
  showProjections = v;
  emitChange();
}

export function triggerInterpolation(targetTheta, targetPhi, targetRadius = 1.0) {
  targetPhi = ((targetPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  targetTheta = Math.max(0, Math.min(Math.PI, targetTheta));

  qState.startTheta = qState.theta;
  qState.startPhi = qState.phi;
  qState.startRadius = qState.radius;

  qState.targetTheta = targetTheta;
  qState.targetPhi = targetPhi;
  qState.targetRadius = targetRadius;

  let deltaPhi = targetPhi - qState.startPhi;
  if (deltaPhi > Math.PI) deltaPhi -= 2 * Math.PI;
  if (deltaPhi < -Math.PI) deltaPhi += 2 * Math.PI;
  qState.targetPhi = qState.startPhi + deltaPhi;

  qState.progress = 0;
  qState.isAnimating = true;
  emitChange();
}

export function setDirectSpherical(theta, phi) {
  triggerInterpolation(theta, phi, 1.0);
}

export function setThetaDirect(theta) {
  qState.isAnimating = false;
  qState.theta = theta;
  emitChange();
}

export function setPhiDirect(phi) {
  qState.isAnimating = false;
  qState.phi = phi;
  emitChange();
}

export function executeGate(type) {
  const th = qState.theta;
  const ph = qState.phi;
  let vx = Math.sin(th) * Math.cos(ph);
  let vy = Math.sin(th) * Math.sin(ph);
  let vz = Math.cos(th);

  let tx = vx, ty = vy, tz = vz;

  switch (type) {
    case 'X': tx = vx; ty = -vy; tz = -vz; break;
    case 'Y': tx = -vx; ty = vy; tz = -vz; break;
    case 'Z': tx = -vx; ty = -vy; tz = vz; break;
    case 'H': tx = vz; ty = -vy; tz = vx; break;
    case 'S': {
      const a = Math.PI / 2;
      tx = vx * Math.cos(a) - vy * Math.sin(a);
      ty = vx * Math.sin(a) + vy * Math.cos(a);
      tz = vz;
      break;
    }
    case 'S_DAG': {
      const a = -Math.PI / 2;
      tx = vx * Math.cos(a) - vy * Math.sin(a);
      ty = vx * Math.sin(a) + vy * Math.cos(a);
      tz = vz;
      break;
    }
    case 'T': {
      const a = Math.PI / 4;
      tx = vx * Math.cos(a) - vy * Math.sin(a);
      ty = vx * Math.sin(a) + vy * Math.cos(a);
      tz = vz;
      break;
    }
    case 'T_DAG': {
      const a = -Math.PI / 4;
      tx = vx * Math.cos(a) - vy * Math.sin(a);
      ty = vx * Math.sin(a) + vy * Math.cos(a);
      tz = vz;
      break;
    }
  }

  const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
  let nTheta = 0, nPhi = 0;
  if (len > 0.0001) {
    nTheta = Math.acos(Math.max(-1, Math.min(1, tz / len)));
    nPhi = Math.atan2(ty, tx);
    if (nPhi < 0) nPhi += 2 * Math.PI;
  }
  triggerInterpolation(nTheta, nPhi, qState.radius);
}

export function executeRotationAxis(axis, angle) {
  const th = qState.theta;
  const ph = qState.phi;
  let vx = Math.sin(th) * Math.cos(ph);
  let vy = Math.sin(th) * Math.sin(ph);
  let vz = Math.cos(th);

  // Rodrigues' rotation formula
  let ax = 0, ay = 0, az = 0;
  if (axis === 'x') ax = 1;
  else if (axis === 'y') ay = 1;
  else az = 1;

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const dot = ax * vx + ay * vy + az * vz;

  const rx = vx * cosA + (ay * vz - az * vy) * sinA + ax * dot * (1 - cosA);
  const ry = vy * cosA + (az * vx - ax * vz) * sinA + ay * dot * (1 - cosA);
  const rz = vz * cosA + (ax * vy - ay * vx) * sinA + az * dot * (1 - cosA);

  let nTheta = Math.acos(Math.max(-1, Math.min(1, rz)));
  let nPhi = Math.atan2(ry, rx);
  if (nPhi < 0) nPhi += 2 * Math.PI;

  triggerInterpolation(nTheta, nPhi, qState.radius);
}

export function measureProjective(basis) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let outcomeState = { theta: 0, phi: 0 };
      let prob = 0.5;
      let result = '';

      if (basis === 'Z') {
        prob = Math.cos(qState.theta / 2) ** 2;
        const isZero = Math.random() < prob;
        outcomeState = isZero ? { theta: 0, phi: 0 } : { theta: Math.PI, phi: 0 };
        result = isZero
          ? `Result: |0⟩ (prob: ${prob.toFixed(2)})`
          : `Result: |1⟩ (prob: ${(1 - prob).toFixed(2)})`;
      } else if (basis === 'X') {
        prob = (1 + Math.sin(qState.theta) * Math.cos(qState.phi)) / 2;
        const isPlus = Math.random() < prob;
        outcomeState = isPlus
          ? { theta: Math.PI / 2, phi: 0 }
          : { theta: Math.PI / 2, phi: Math.PI };
        result = isPlus
          ? `Result: |+⟩ (prob: ${prob.toFixed(2)})`
          : `Result: |-⟩ (prob: ${(1 - prob).toFixed(2)})`;
      } else if (basis === 'Y') {
        prob = (1 + Math.sin(qState.theta) * Math.sin(qState.phi)) / 2;
        const isPlusI = Math.random() < prob;
        outcomeState = isPlusI
          ? { theta: Math.PI / 2, phi: Math.PI / 2 }
          : { theta: Math.PI / 2, phi: (3 * Math.PI) / 2 };
        result = isPlusI
          ? `Result: |+i⟩ (prob: ${prob.toFixed(2)})`
          : `Result: |-i⟩ (prob: ${(1 - prob).toFixed(2)})`;
      }

      triggerInterpolation(outcomeState.theta, outcomeState.phi, 1.0);
      resolve(result);
    }, 250);
  });
}

export function toggleWeakMeasurement() {
  if (!isWeakMeasuring) {
    isWeakMeasuring = true;
    emitChange();

    weakMeasureInterval = setInterval(() => {
      const epsilon = 0.08;
      const noise = (Math.random() - 0.5) * 2;

      let z = Math.cos(qState.theta);
      z = z + epsilon * (1 - z * z) * noise;
      z = Math.max(-0.999, Math.min(0.999, z));

      qState.theta = Math.acos(z);

      if (Math.abs(z) > 0.985) {
        clearInterval(weakMeasureInterval);
        isWeakMeasuring = false;
      }
      emitChange();
    }, 100);
  } else {
    clearInterval(weakMeasureInterval);
    isWeakMeasuring = false;
    emitChange();
  }
}

export function startBerryLoopAnimation() {
  const pathNodes = [
    { theta: 0, phi: 0 },
    { theta: Math.PI / 2, phi: 0 },
    { theta: Math.PI / 2, phi: Math.PI / 2 },
    { theta: 0, phi: 0 },
  ];

  let step = 0;
  function traverseNext() {
    if (step >= pathNodes.length) return;
    const target = pathNodes[step];
    triggerInterpolation(target.theta, target.phi, 1.0);
    step++;
    setTimeout(traverseNext, 1200);
  }
  traverseNext();
}

export function clearBerryLoop() {
  triggerInterpolation(0, 0, 1.0);
}

export function toggleLarmorSimulation() {
  isLarmorRunning = !isLarmorRunning;
  if (isLarmorRunning) larmorTime = 0;
  emitChange();
}

export function setLarmorFrame(frame) {
  larmorFrame = frame;
  emitChange();
}

export function updateLarmorPhysics(dt, detuning, rabiFreq) {
  if (!isLarmorRunning) return false;
  larmorTime += dt;

  const omegaEff = Math.sqrt(detuning * detuning + rabiFreq * rabiFreq);

  if (omegaEff > 0.001) {
    const tiltAngle = Math.atan2(rabiFreq, detuning);
    const cost = Math.cos(omegaEff * larmorTime);
    const z = Math.cos(tiltAngle) ** 2 + Math.sin(tiltAngle) ** 2 * cost;
    const newTheta = Math.acos(Math.max(-1, Math.min(1, z)));

    let newPhi = Math.sin(omegaEff * larmorTime) > 0 ? tiltAngle : -tiltAngle;
    if (larmorFrame === 'lab') {
      const omega0 = 2.5;
      newPhi += omega0 * larmorTime;
    }

    qState.theta = newTheta;
    qState.phi = ((newPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    qState.radius = 1.0;
    emitChange();
    return true;
  }
  return false;
}






export function applyDecoherenceStep(type) {
  if (type === 't1') {
    const gamma = 0.25;
    let vx = qState.radius * Math.sin(qState.theta) * Math.cos(qState.phi);
    let vy = qState.radius * Math.sin(qState.theta) * Math.sin(qState.phi);
    let vz = qState.radius * Math.cos(qState.theta);
    vx *= Math.sqrt(1 - gamma);
    vy *= Math.sqrt(1 - gamma);
    vz = vz * (1 - gamma) + gamma;
    const newR = Math.sqrt(vx * vx + vy * vy + vz * vz);
    const newTh = Math.acos(vz / (newR || 1));
    const newPh = Math.atan2(vy, vx);
    triggerInterpolation(newTh, newPh, Math.min(1.0, newR));
  } else if (type === 't2') {
    const gammaPhi = 0.35;
    let vx = qState.radius * Math.sin(qState.theta) * Math.cos(qState.phi) * (1 - gammaPhi);
    let vy = qState.radius * Math.sin(qState.theta) * Math.sin(qState.phi) * (1 - gammaPhi);
    let vz = qState.radius * Math.cos(qState.theta);
    const newR = Math.sqrt(vx * vx + vy * vy + vz * vz);
    const newTh = Math.acos(vz / (newR || 1));
    const newPh = Math.atan2(vy, vx);
    triggerInterpolation(newTh, newPh, Math.max(0.05, newR));
  } else if (type === 'depolar') {
    const p = 0.25;
    const newR = Math.max(0.01, qState.radius * (1 - p));
    triggerInterpolation(qState.theta, qState.phi, newR);
  }
}

export function purifyState() {
  triggerInterpolation(qState.theta, qState.phi, 1.0);
}

export function setEntanglementConcurrence(c) {
  const rz = Math.sqrt(Math.max(0, 1 - c * c));
  qState.theta = 0;
  qState.phi = 0;
  qState.radius = rz;
  qState.isAnimating = false;
  emitChange();
}

export function execKickbackStep(step) {
  kickbackStep = step;
  switch (step) {
    case 1:
      qState.theta = 0; qState.phi = 0;
      qTargetState.theta = Math.PI; qTargetState.phi = 0;
      break;
    case 2:
      qState.theta = Math.PI / 2; qState.phi = 0;
      qTargetState.theta = Math.PI / 2; qTargetState.phi = Math.PI;
      break;
    case 3:
      qState.phi = Math.PI;
      break;
    case 4:
      qState.theta = Math.PI; qState.phi = 0;
      break;
  }
  qState.isAnimating = false;
  emitChange();
}

// Animation step - called every frame from Three.js loop
export function animationStep(speed) {
  if (qState.isAnimating) {
    qState.progress += 0.02 * speed;
    if (qState.progress >= 1.0) {
      qState.progress = 1.0;
      qState.isAnimating = false;
      qState.theta = qState.targetTheta;
      qState.phi = ((qState.targetPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      qState.radius = qState.targetRadius;
    } else {
      const t = Math.sin((qState.progress - 0.5) * Math.PI) * 0.5 + 0.5;
      qState.theta = qState.startTheta + (qState.targetTheta - qState.startTheta) * t;
      qState.phi = qState.startPhi + (qState.targetPhi - qState.startPhi) * t;
      qState.radius = qState.startRadius + (qState.targetRadius - qState.startRadius) * t;
    }
    // Keep panels and the analytics footer in sync with the animated state
    emitChange();
  }
}

// Getters for the animation loop (avoid creating new objects)
export function getQState() { return qState; }
export function getQTargetState() { return qTargetState; }
export function getActiveModule() { return activeModule; }
export function getAnimSpeed() { return animSpeed; }
export function getShowTrails() { return showTrails; }
export function getShowProjections() { return showProjections; }
export function getIsLarmorRunning() { return isLarmorRunning; }

// React hook
export function useQuantumStore() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
