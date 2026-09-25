# Advanced Quantum Bloch Sphere Master Laboratory

An interactive 3D quantum computing educational tool built with React, Three.js, and Tailwind CSS.

## Features

- **Single Qubit Control** — Manipulate polar (θ) and azimuthal (φ) angles with real-time 3D Bloch sphere visualization
- **SU(2) Quantum Gates** — Apply X, Y, Z, H, S, S†, T, T† gates with animated transitions
- **Berry Phase** — Visualize geometric phase accumulation along closed geodesic paths
- **Larmor Precession & Rabi Oscillations** — Real-time magnetic resonance dynamics in rotating and lab frames
- **Open Systems & Decoherence** — T₁ amplitude damping, T₂* dephasing, and depolarizing channels via Lindblad dynamics
- **Entanglement** — Explore bipartite entanglement with concurrence control and reduced density matrix visualization
- **Phase Kickback** — Step-by-step interactive CNOT kickback circuit protocol
- **Live Analytics** — State vector, complex amplitudes, phasor diagram, measurement probabilities, density matrix, purity, and entropy

## Tech Stack

- **React 18** + **Vite** — Modern build tooling
- **Three.js** — 3D WebGL Bloch sphere rendering
- **Tailwind CSS 3** — Utility-first styling with glassmorphism
- **KaTeX** — High-fidelity LaTeX math rendering
- **Lucide React** — Beautiful icon system

## Getting Started

```bash
npm install
npm run dev
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| X | Apply X (Pauli-X) gate |
| Y | Apply Y (Pauli-Y) gate |
| Z | Apply Z (Pauli-Z) gate |
| H | Apply Hadamard gate |
| S | Apply S (phase) gate |
| T | Apply T (π/8) gate |
| R | Reset camera |

## Deployment

This project is deployed on Vercel. Push to `main` to trigger automatic deployment.
