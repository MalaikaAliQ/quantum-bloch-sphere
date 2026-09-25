import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  getQState, getQTargetState, getActiveModule, getAnimSpeed,
  getShowTrails, getShowProjections, animationStep, updateLarmorPhysics,
  getIsLarmorRunning,
} from '../store/quantumStore';

const MAX_TRAIL_POINTS = 220;

export default function BlochScene({ detuning, rabiFreq, onLabelsReady }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const frameIdRef = useRef(null);

  // Store mutable refs for physics params
  const detuningRef = useRef(detuning ?? 0);
  const rabiRef = useRef(rabiFreq ?? 1.2);

  useEffect(() => { detuningRef.current = detuning ?? 0; }, [detuning]);
  useEffect(() => { rabiRef.current = rabiFreq ?? 1.2; }, [rabiFreq]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // ---- SCENE SETUP ----
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.035);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(2.8, 1.8, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

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

    function createBlochSphereObject(primaryColorHex) {
      const group = new THREE.Group();
      const R = 1.25;

      // Transparent sphere
      const sphereGeo = new THREE.SphereGeometry(R, 48, 48);
      group.add(new THREE.Mesh(sphereGeo, new THREE.MeshPhysicalMaterial({
        color: 0x0f172a, transparent: true, opacity: 0.28,
        roughness: 0.1, metalness: 0.1, transmission: 0.7, ior: 1.15,
      })));

      // Wireframe
      group.add(new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
        color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.08,
      })));

      // Equatorial ring
      const ringGeo = new THREE.RingGeometry(R * 0.99, R * 1.01, 64);
      const equatorRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.45,
      }));
      equatorRing.rotation.x = Math.PI / 2;
      group.add(equatorRing);

      // Polar grid
      group.add(new THREE.PolarGridHelper(R, 8, 4, 32, 0x1e293b, 0x0f2744));

      // Axes
      const axisLen = R * 1.45;
      const createAxis = (start, end, color) => {
        const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
        group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.65 })));
      };
      createAxis(new THREE.Vector3(0, -axisLen, 0), new THREE.Vector3(0, axisLen, 0), 0x38bdf8);
      createAxis(new THREE.Vector3(-axisLen, 0, 0), new THREE.Vector3(axisLen, 0, 0), 0x10b981);
      createAxis(new THREE.Vector3(0, 0, -axisLen), new THREE.Vector3(0, 0, axisLen), 0xf59e0b);

      // Basis markers & labels
      const createMarker = (pos, color, text) => {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.035, 12, 12),
          new THREE.MeshBasicMaterial({ color })
        );
        dot.position.copy(pos);
        group.add(dot);

        const label = document.createElement('div');
        label.className = 'quantum-label';
        label.innerText = text;
        container.appendChild(label);
        labelElements.push({ element: label, position: pos.clone(), parent: group });
      };

      createMarker(new THREE.Vector3(0, R, 0), 0x38bdf8, '|0⟩ (Z+)');
      createMarker(new THREE.Vector3(0, -R, 0), 0x38bdf8, '|1⟩ (Z-)');
      createMarker(new THREE.Vector3(R, 0, 0), 0x10b981, '|+⟩ (X+)');
      createMarker(new THREE.Vector3(-R, 0, 0), 0x10b981, '|-⟩ (X-)');
      createMarker(new THREE.Vector3(0, 0, R), 0xf59e0b, '|+i⟩ (Y+)');
      createMarker(new THREE.Vector3(0, 0, -R), 0xf59e0b, '|-i⟩ (Y-)');

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
      const tipOrb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      tipOrb.position.y = 1;
      arrowGroup.add(tipOrb);
      group.add(arrowGroup);

      // Projections
      const projMat = new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.05, gapSize: 0.03, transparent: true, opacity: 0.7 });
      const projGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const projLine = new THREE.Line(projGeo, projMat);
      projLine.computeLineDistances();
      group.add(projLine);

      const projDisk = new THREE.Mesh(new THREE.RingGeometry(0.01, 0.045, 16), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
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
        const sp = wp.project(camera);
        item.element.style.opacity = sp.z > 0.95 ? '0.2' : '0.9';
        item.element.style.left = `${(sp.x * wHalf) + wHalf}px`;
        item.element.style.top = `${-(sp.y * hHalf) + hHalf}px`;
      });
    }

    // ---- RESIZE ----
    function onResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    // Store scene ref for external access (reset camera etc)
    sceneRef.current = {
      camera, controls, scene,
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
          camera.position.set(2.8, 1.8, 3.2);
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
