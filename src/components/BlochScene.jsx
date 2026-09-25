import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  getQState, getQTargetState, getActiveModule, getAnimSpeed,
  getShowTrails, getShowProjections, animationStep, updateLarmorPhysics,
  getIsLarmorRunning,
} from '../store/quantumStore';

const MAX_TRAIL_POINTS = 220;

// Scene colours per UI theme (axis hues match the panel tones: Z = cyan, X = emerald, Y = amber)
const SCENE_THEMES = {
  dark: {
    fog: 0x030712, sphere: 0x0f172a, sphereOpacity: 0.28, wire: 0x38bdf8, wireOpacity: 0.08,
    ring: 0x38bdf8, ringOpacity: 0.45, grid: 0x1e3a5f, gridOpacity: 0.9,
    axisZ: 0x38bdf8, axisX: 0x10b981, axisY: 0xf59e0b, axisOpacity: 0.65, proj: 0xe2e8f0, tip: 0xffffff,
  },
  light: {
    fog: 0xe8edf4, sphere: 0xcfe3f1, sphereOpacity: 0.4, wire: 0x0e7490, wireOpacity: 0.13,
    ring: 0x0891b2, ringOpacity: 0.7, grid: 0x94a3b8, gridOpacity: 0.55,
    axisZ: 0x0284c7, axisX: 0x059669, axisY: 0xd97706, axisOpacity: 0.9, proj: 0x475569, tip: 0x0f172a,
  },
};

export default function BlochScene({ theme = 'dark', detuning, rabiFreq, onLabelsReady }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const frameIdRef = useRef(null);

  // Store mutable refs for physics params
  const detuningRef = useRef(detuning ?? 0);
  const rabiRef = useRef(rabiFreq ?? 1.2);

  useEffect(() => { detuningRef.current = detuning ?? 0; }, [detuning]);
  useEffect(() => { rabiRef.current = rabiFreq ?? 1.2; }, [rabiFreq]);

  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
    sceneRef.current?.applyTheme?.(theme);
  }, [theme]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // ---- SCENE SETUP ----
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(SCENE_THEMES.dark.fog, 0.035);

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(3.0, 1.95, 3.45);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.error('WebGL initialization error:', err);
      const fallback = document.createElement('div');
      fallback.className = 'w-full h-full flex flex-col items-center justify-center text-cyan-300 font-mono text-xs p-4 text-center';
      fallback.innerHTML = '<p class="font-bold text-amber-400">WebGL 3D Context Unavailable</p><p class="text-slate-400 text-[11px] mt-1">Please ensure WebGL is enabled in your browser graphics settings.</p>';
      container.appendChild(fallback);
      return;
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.6;
    controls.maxDistance = 12;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const purpleLight = new THREE.PointLight(0xa855f7, 2.5, 12);
    purpleLight.position.set(-4, -2, -3);
    scene.add(purpleLight);

    // ---- CREATE BLOCH SPHERE ----
    const labelElements = [];
    // Callbacks that recolour scene objects for the active theme
    const themeAppliers = [];
    const themed = (fn) => { themeAppliers.push(fn); fn(SCENE_THEMES[themeRef.current] || SCENE_THEMES.dark); };

    function createBlochSphereObject(primaryColorHex) {
      const group = new THREE.Group();
      const R = 1.25;

      // Transparent sphere
      const sphereGeo = new THREE.SphereGeometry(R, 48, 48);
      const sphereMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a, transparent: true, opacity: 0.28,
        roughness: 0.1, metalness: 0.1, transmission: 0.7, ior: 1.15,
      });
      group.add(new THREE.Mesh(sphereGeo, sphereMat));
      themed((t) => { sphereMat.color.setHex(t.sphere); sphereMat.opacity = t.sphereOpacity; });

      // Wireframe
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.08,
      });
      group.add(new THREE.Mesh(sphereGeo, wireMat));
      themed((t) => { wireMat.color.setHex(t.wire); wireMat.opacity = t.wireOpacity; });

      // Equatorial ring
      const ringGeo = new THREE.RingGeometry(R * 0.99, R * 1.01, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.45,
      });
      const equatorRing = new THREE.Mesh(ringGeo, ringMat);
      themed((t) => { ringMat.color.setHex(t.ring); ringMat.opacity = t.ringOpacity; });
      equatorRing.rotation.x = Math.PI / 2;
      group.add(equatorRing);

      // Polar grid
      const polarGrid = new THREE.PolarGridHelper(R, 8, 4, 32);
      polarGrid.material.vertexColors = false;
      polarGrid.material.transparent = true;
      group.add(polarGrid);
      themed((t) => { polarGrid.material.color.setHex(t.grid); polarGrid.material.opacity = t.gridOpacity; polarGrid.material.needsUpdate = true; });

      // Axes
      const axisLen = R * 1.45;
      const createAxis = (start, end, key) => {
        const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
        const mat = new THREE.LineBasicMaterial({ transparent: true });
        group.add(new THREE.Line(geo, mat));
        themed((t) => { mat.color.setHex(t[key]); mat.opacity = t.axisOpacity; });
      };
      createAxis(new THREE.Vector3(0, -axisLen, 0), new THREE.Vector3(0, axisLen, 0), 'axisZ');
      createAxis(new THREE.Vector3(-axisLen, 0, 0), new THREE.Vector3(axisLen, 0, 0), 'axisX');
      createAxis(new THREE.Vector3(0, 0, -axisLen), new THREE.Vector3(0, 0, axisLen), 'axisY');

      // Basis markers & labels
      const createMarker = (pos, text, axis) => {
        const dotMat = new THREE.MeshBasicMaterial();
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), dotMat);
        const colorKey = { z: 'axisZ', x: 'axisX', y: 'axisY' }[axis];
        themed((t) => dotMat.color.setHex(t[colorKey]));
        dot.position.copy(pos);
        group.add(dot);

        const label = document.createElement('div');
        label.className = `quantum-label axis-${axis}`;
        label.innerText = text;
        container.appendChild(label);
        labelElements.push({ element: label, position: pos.clone(), parent: group });
      };

      createMarker(new THREE.Vector3(0, R, 0), '|0⟩ (Z+)', 'z');
      createMarker(new THREE.Vector3(0, -R, 0), '|1⟩ (Z-)', 'z');
      createMarker(new THREE.Vector3(R, 0, 0), '|+⟩ (X+)', 'x');
      createMarker(new THREE.Vector3(-R, 0, 0), '|-⟩ (X-)', 'x');
      createMarker(new THREE.Vector3(0, 0, R), '|+i⟩ (Y+)', 'y');
      createMarker(new THREE.Vector3(0, 0, -R), '|-i⟩ (Y-)', 'y');

      // State arrow
      const arrowGroup = new THREE.Group();
      const shaftGeo = new THREE.CylinderGeometry(0.024, 0.024, 1, 16);
      shaftGeo.translate(0, 0.5, 0);
      arrowGroup.add(new THREE.Mesh(shaftGeo, new THREE.MeshStandardMaterial({
        color: primaryColorHex, emissive: primaryColorHex, emissiveIntensity: 0.6,
      })));
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 20), new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: primaryColorHex,
      }));
      cone.position.y = 1;
      arrowGroup.add(cone);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const tipOrb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), tipMat);
      themed((t) => tipMat.color.setHex(t.tip));
      tipOrb.position.y = 1;
      arrowGroup.add(tipOrb);
      group.add(arrowGroup);

      // Projections
      const projMat = new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.06, gapSize: 0.035, transparent: true, opacity: 0.95 });
      const projGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const projLine = new THREE.Line(projGeo, projMat);
      themed((t) => projMat.color.setHex(t.proj));
      projLine.computeLineDistances();
      group.add(projLine);

      const projDisk = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.06, 24), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
      projDisk.rotation.x = Math.PI / 2;
      group.add(projDisk);

      // Trail
      const trailMesh = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: primaryColorHex, transparent: true, opacity: 0.85 }));
      group.add(trailMesh);

      // Angle arcs
      const thetaArc = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 }));
      group.add(thetaArc);
      const phiArc = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.8 }));
      group.add(phiArc);

      group.userData = { arrow: arrowGroup, radius: R, primaryColor: primaryColorHex, projLine, projDisk, trailMesh, thetaArc, phiArc };
      return group;
    }

    const blochSingle = createBlochSphereObject(0x06b6d4);
    scene.add(blochSingle);

    let blochControl = null;
    let blochTarget = null;

    function ensureKickbackSpheres() {
      if (!blochControl) {
        blochControl = createBlochSphereObject(0x38bdf8);
        blochControl.position.set(-1.85, 0, 0);
        scene.add(blochControl);
      }
      if (!blochTarget) {
        blochTarget = createBlochSphereObject(0xf43f5e);
        blochTarget.position.set(1.85, 0, 0);
        scene.add(blochTarget);
      }
    }

    // ---- HELPERS ----
    function sphericalToCartesian(theta, phi, r, R) {
      const radius = R || 1.25;
      return new THREE.Vector3(
        r * radius * Math.sin(theta) * Math.cos(phi),
        r * radius * Math.cos(theta),
        r * radius * Math.sin(theta) * Math.sin(phi)
      );
    }

    const trailPoints = [];

    function recordTrail(pos) {
      if (!getShowTrails()) return;
      trailPoints.push(pos.clone());
      if (trailPoints.length > MAX_TRAIL_POINTS) trailPoints.shift();

      const floats = new Float32Array(trailPoints.length * 3);
      for (let i = 0; i < trailPoints.length; i++) {
        floats[i * 3] = trailPoints[i].x;
        floats[i * 3 + 1] = trailPoints[i].y;
        floats[i * 3 + 2] = trailPoints[i].z;
      }
      blochSingle.userData.trailMesh.geometry.setAttribute('position', new THREE.BufferAttribute(floats, 3));
      blochSingle.userData.trailMesh.geometry.attributes.position.needsUpdate = true;
    }

    function updateBlochVisuals(group, theta, phi, radius) {
      if (!group) return;
      const R = group.userData.radius;
      const pos = sphericalToCartesian(theta, phi, radius, R);
      const len = pos.length();

      const arrow = group.userData.arrow;
      if (len > 0.001) {
        arrow.visible = true;
        arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
        arrow.scale.set(1, len, 1);
      } else {
        arrow.visible = false;
      }

      // Projections
      const showProj = getShowProjections();
      const { projLine, projDisk } = group.userData;

      if (showProj && len > 0.02) {
        projLine.visible = true;
        projDisk.visible = true;
        const eqPos = new THREE.Vector3(pos.x, 0, pos.z);
        const linePos = new Float32Array([pos.x, pos.y, pos.z, eqPos.x, eqPos.y, eqPos.z, 0, 0, 0, eqPos.x, eqPos.y, eqPos.z]);
        projLine.geometry.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        projLine.geometry.attributes.position.needsUpdate = true;
        projLine.computeLineDistances();
        projDisk.position.copy(eqPos);
      } else {
        projLine.visible = false;
        projDisk.visible = false;
      }

      // Theta arc
      const { thetaArc } = group.userData;
      if (theta > 0.05) {
        const pts = [];
        const arcR = R * 0.45;
        for (let i = 0; i <= 24; i++) {
          const t = (i / 24) * theta;
          pts.push(new THREE.Vector3(arcR * Math.sin(t) * Math.cos(phi), arcR * Math.cos(t), arcR * Math.sin(t) * Math.sin(phi)));
        }
        thetaArc.geometry.setFromPoints(pts);
        thetaArc.visible = true;
      } else {
        thetaArc.visible = false;
      }

      // Phi arc
      const { phiArc } = group.userData;
      if (phi > 0.05 && Math.sin(theta) > 0.1) {
        const pts = [];
        const arcR = R * 0.55;
        for (let i = 0; i <= 24; i++) {
          const p = (i / 24) * phi;
          pts.push(new THREE.Vector3(arcR * Math.cos(p), 0, arcR * Math.sin(p)));
        }
        phiArc.geometry.setFromPoints(pts);
        phiArc.visible = true;
      } else {
        phiArc.visible = false;
      }
    }

    function projectLabels() {
      const wHalf = container.clientWidth / 2;
      const hHalf = container.clientHeight / 2;
      labelElements.forEach(item => {
        if (!item.parent.visible) { item.element.style.display = 'none'; return; }
        item.element.style.display = 'block';
        const wp = item.position.clone();
        item.parent.localToWorld(wp);
        // Dim only labels on the far hemisphere (facing away from the camera)
        const center = item.parent.getWorldPosition(new THREE.Vector3());
        const facing = wp.clone().sub(center).dot(camera.position.clone().sub(center));
        const sp = wp.project(camera);
        item.element.style.opacity = facing < -0.05 ? '0.55' : '1';
        item.element.style.zIndex = facing < -0.05 ? '1' : '2';
        item.element.style.left = `${(sp.x * wHalf) + wHalf}px`;
        item.element.style.top = `${-(sp.y * hHalf) + hHalf}px`;
      });
    }

    function applyTheme(name) {
      const t = SCENE_THEMES[name] || SCENE_THEMES.dark;
      scene.fog.color.setHex(t.fog);
      themeAppliers.forEach((fn) => fn(t));
    }
    applyTheme(themeRef.current);

    // ---- RESIZE ----
    function onResize() {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        // Centre the sphere in the space above the analytics footer instead of behind it
        const footer = document.getElementById('analytics-footer');
        const reserved = footer ? footer.offsetHeight + 16 : 0;
        const offsetY = Math.round(reserved / 2);
        camera.setViewOffset(w, h, 0, offsetY, w, h);
        // Shrink the view when the free area above the footer is short, so the poles stay on screen
        const freeRatio = (h - reserved) / h;
        camera.zoom = Math.min(1, Math.max(0.55, freeRatio / 0.8));
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    }
    window.addEventListener('resize', onResize);
    const footerObserver = new ResizeObserver(onResize);
    const footerEl = document.getElementById('analytics-footer');
    if (footerEl) footerObserver.observe(footerEl);
    onResize();

    // Store scene ref for external access (reset camera etc)
    sceneRef.current = {
      camera, controls, scene, applyTheme,
      blochSingle, getBlochControl: () => blochControl, getBlochTarget: () => blochTarget,
      clearTrail: () => {
        trailPoints.length = 0;
        blochSingle.userData.trailMesh.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
      },
      resetCamera: () => {
        const mod = getActiveModule();
        if (mod === 'kickback') {
          camera.position.set(0, 2.2, 5.5);
        } else {
          camera.position.set(3.0, 1.95, 3.45);
        }
        controls.target.set(0, 0, 0);
        trailPoints.length = 0;
        blochSingle.userData.trailMesh.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
      },
    };

    if (onLabelsReady) onLabelsReady(sceneRef);

    // ---- ANIMATION LOOP ----
    let lastModule = '';

    function animate() {
      frameIdRef.current = requestAnimationFrame(animate);
      const speed = getAnimSpeed();
      const dt = 0.016 * speed;
      const mod = getActiveModule();

      // Module switching visibility
      if (mod !== lastModule) {
        const leavingKickback = lastModule === 'kickback';
        lastModule = mod;
        if (mod === 'kickback') {
          ensureKickbackSpheres();
          blochSingle.visible = false;
          blochControl.visible = true;
          blochTarget.visible = true;
          camera.position.set(0, 2.2, 5.5);
          controls.target.set(0, 0, 0);
        } else {
          blochSingle.visible = true;
          if (blochControl) blochControl.visible = false;
          if (blochTarget) blochTarget.visible = false;
          // Restore the single-sphere viewing angle after the side-by-side kickback view
          if (leavingKickback) {
            camera.position.set(3.0, 1.95, 3.45);
            controls.target.set(0, 0, 0);
          }
        }
      }

      // Larmor physics
      if (mod === 'larmor') {
        updateLarmorPhysics(dt, detuningRef.current, rabiRef.current);
      }

      // Interpolation step
      animationStep(speed);

      const q = getQState();

      // Update visuals
      if (mod !== 'kickback') {
        updateBlochVisuals(blochSingle, q.theta, q.phi, q.radius);
        if (q.isAnimating || mod === 'larmor') {
          const curPos = sphericalToCartesian(q.theta, q.phi, q.radius, blochSingle.userData.radius);
          recordTrail(curPos);
        }
      } else if (blochControl && blochTarget) {
        const qt = getQTargetState();
        updateBlochVisuals(blochControl, q.theta, q.phi, 1.0);
        updateBlochVisuals(blochTarget, qt.theta, qt.phi, 1.0);
      }

      projectLabels();
      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', onResize);
      footerObserver.disconnect();
      labelElements.forEach(item => item.element.remove());
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []); // Mount once

  return (
    <div
      ref={containerRef}
      id="three-container"
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
    />
  );
}
