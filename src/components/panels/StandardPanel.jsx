import { useState, useCallback } from 'react';
import { Sliders, Binary, Eye } from 'lucide-react';
import { useQuantumStore, setDirectSpherical, setThetaDirect, setPhiDirect, executeGate, executeRotationAxis, measureProjective, toggleWeakMeasurement } from '../../store/quantumStore';

// Colour follows the Bloch axis a control acts on: Z = cyan, X = emerald, Y = amber, H (X+Z) = neutral
const EIGENSTATES = [
  { label: '|0⟩', axis: 'Z+', tone: 'tone-z', theta: 0, phi: 0 },
  { label: '|1⟩', axis: 'Z−', tone: 'tone-z', theta: Math.PI, phi: 0 },
  { label: '|+⟩', axis: 'X+', tone: 'tone-x', theta: Math.PI / 2, phi: 0 },
  { label: '|−⟩', axis: 'X−', tone: 'tone-x', theta: Math.PI / 2, phi: Math.PI },
  { label: '|+i⟩', axis: 'Y+', tone: 'tone-y', theta: Math.PI / 2, phi: Math.PI / 2 },
  { label: '|−i⟩', axis: 'Y−', tone: 'tone-y', theta: Math.PI / 2, phi: 3 * Math.PI / 2 },
];

const GATES = [
  { g: 'X', label: 'Bit flip', tone: 'tone-x' },
  { g: 'Y', label: 'π about Y', tone: 'tone-y' },
  { g: 'Z', label: 'Phase flip', tone: 'tone-z' },
  { g: 'H', label: 'Hadamard', tone: 'tone-h' },
  { g: 'S', label: 'π/2 about Z', tone: 'tone-z' },
  { g: 'S_DAG', label: '−π/2 about Z', tone: 'tone-z', display: 'S†' },
  { g: 'T', label: 'π/4 about Z', tone: 'tone-z' },
  { g: 'T_DAG', label: '−π/4 about Z', tone: 'tone-z', display: 'T†' },
];

const ROTATIONS = [
  { axis: 'x', label: 'R', sub: 'x', tone: 'tone-x' },
  { axis: 'y', label: 'R', sub: 'y', tone: 'tone-y' },
  { axis: 'z', label: 'R', sub: 'z', tone: 'tone-z' },
];

export default function StandardPanel() {
  const { qState, isWeakMeasuring } = useQuantumStore();
  const [measureLog, setMeasureLog] = useState('Awaiting quantum measurement…');
  const [measuring, setMeasuring] = useState(false);

  const handleMeasure = useCallback(async (basis) => {
    setMeasuring(true);
    setMeasureLog(`Wavefunction collapsing in ${basis}-basis…`);
    const result = await measureProjective(basis);
    setMeasureLog(result);
    setMeasuring(false);
  }, []);

  const thetaDeg = Math.round(qState.theta * 180 / Math.PI);
  const phiDeg = Math.round(qState.phi * 180 / Math.PI);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Angle sliders */}
      <section className="glass-panel p-3.5 rounded-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="section-title text-cyan-300">
            <Sliders className="w-3.5 h-3.5" /> Polar &amp; azimuthal angles
          </h2>
          <span className="font-mono text-xs text-slate-400">(θ, φ)</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="field-label">θ · Polar angle</span>
            <span className="value text-cyan-300">{(qState.theta / Math.PI).toFixed(2)}π <span className="text-slate-400">({thetaDeg}°)</span></span>
          </div>
          <input type="range" min="0" max="3.14159265" step="0.01" value={qState.theta}
            onChange={(e) => setThetaDirect(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer" />
          <div className="flex justify-between hint font-mono">
            <span>0 |0⟩</span><span>π/2 equator</span><span>π |1⟩</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="field-label">φ · Relative phase</span>
            <span className="value text-violet-300">{(qState.phi / Math.PI).toFixed(2)}π <span className="text-slate-400">({phiDeg}°)</span></span>
          </div>
          <input type="range" min="0" max="6.2831853" step="0.01" value={qState.phi}
            onChange={(e) => setPhiDirect(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-violet" />
          <div className="flex justify-between hint font-mono">
            <span>0 +x</span><span>π/2 +y</span><span>π −x</span><span>2π</span>
          </div>
        </div>
      </section>

      {/* Canonical Eigenstates */}
      <section className="glass-panel p-3.5 rounded-xl space-y-2.5">
        <h2 className="section-title text-slate-200">Canonical eigenstates</h2>
        <div className="grid grid-cols-3 gap-1.5">
          {EIGENSTATES.map(({ label, axis, tone, theta, phi }) => (
            <button key={axis} onClick={() => setDirectSpherical(theta, phi)}
              className={`tone-btn ${tone} py-1.5 px-2 flex items-baseline justify-center gap-1.5`}>
              <span className="font-mono text-sm font-semibold">{label}</span>
              <span className="text-xs font-medium">{axis}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Gates */}
      <section className="glass-panel p-3.5 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title text-cyan-300">
            <Binary className="w-3.5 h-3.5" /> Single-qubit unitary gates
          </h2>
          <span className="font-mono text-xs text-slate-400">SU(2)</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {GATES.map(({ g, label, tone, display }) => (
            <button key={g} onClick={() => executeGate(g)}
              className={`tone-btn ${tone} px-1 py-2 flex flex-col items-center gap-0.5`}>
              <span className="font-mono text-base font-bold leading-tight">{display || g}</span>
              <span className="text-[11px] leading-tight whitespace-nowrap text-slate-400">{label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2 pt-2.5 border-t border-slate-800">
          <span className="hint">Continuous rotations <span className="font-mono">(δ = π/4)</span></span>
          <div className="grid grid-cols-3 gap-1.5">
            {ROTATIONS.map(({ axis, label, sub, tone }) => (
              <button key={axis} onClick={() => executeRotationAxis(axis, Math.PI / 4)}
                className={`tone-btn ${tone} py-1.5 font-mono text-[13px] font-semibold`}>
                {label}<sub className="text-[11px]">{sub}</sub>(π/4)
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Measurement Engine */}
      <section className="glass-panel p-3.5 rounded-xl space-y-3 !border-rose-500/25">
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-title text-rose-300">
            <Eye className="w-3.5 h-3.5" /> Quantum measurement
          </h2>
          <span className="hint shrink-0">Von Neumann &amp; weak</span>
        </div>

        <div className="space-y-2">
          <span className="hint">Sharp projective measurement</span>
          <div className="grid grid-cols-3 gap-1.5">
            {['Z', 'X', 'Y'].map((basis) => (
              <button key={basis} onClick={() => handleMeasure(basis)}
                className="tone-btn tone-m py-1.5 text-[13px] font-semibold">
                <span className="font-mono">{basis}</span>-basis
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 pt-2.5 border-t border-slate-800">
          <div className="flex justify-between items-center gap-2">
            <span className="field-label">Continuous weak measurement <span className="font-mono text-cyan-300">(Z)</span></span>
            <button onClick={toggleWeakMeasurement}
              className={`tone-btn shrink-0 whitespace-nowrap px-2.5 py-1 text-xs font-semibold ${isWeakMeasuring ? 'tone-m' : 'tone-z'}`}>
              {isWeakMeasuring ? 'Halt POVM' : 'Start diffusion'}
            </button>
          </div>
          <p className="hint leading-snug">
            Simulates stochastic quantum-trajectory diffusion with weak Kraus operators, showing gradual wave-function collapse.
          </p>
        </div>

        <div className={`text-center text-xs font-mono py-1.5 rounded-lg bg-slate-900 border border-slate-800 ${measuring ? 'text-rose-300 animate-pulse' : 'text-slate-300'}`}>
          {measureLog}
        </div>
      </section>
    </div>
  );
}
