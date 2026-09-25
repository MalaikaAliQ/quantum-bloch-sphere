import { useState, useCallback } from 'react';
import { Sliders, Binary, Eye } from 'lucide-react';
import { useQuantumStore, setDirectSpherical, setThetaDirect, setPhiDirect, executeGate, executeRotationAxis, measureProjective, toggleWeakMeasurement } from '../../store/quantumStore';

export default function StandardPanel() {
  const { qState, isWeakMeasuring } = useQuantumStore();
  const [measureLog, setMeasureLog] = useState('Awaiting quantum measurement...');
  const [measuring, setMeasuring] = useState(false);

  const handleMeasure = useCallback(async (basis) => {
    setMeasuring(true);
    setMeasureLog(`Wavefunction collapsing in ${basis}-basis...`);
    const result = await measureProjective(basis);
    setMeasureLog(result);
    setMeasuring(false);
  }, []);

  const thetaDeg = Math.round(qState.theta * 180 / Math.PI);
  const phiDeg = Math.round(qState.phi * 180 / Math.PI);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Angle sliders */}
      <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Polar &amp; Azimuthal Angles
          </span>
          <span className="text-[11px] text-slate-400 font-mono">(θ, φ)</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300">θ (Polar Angle):</span>
            <span className="text-cyan-400 font-bold">{(qState.theta / Math.PI).toFixed(2)}π ({thetaDeg}°)</span>
          </div>
          <input type="range" min="0" max="3.14159265" step="0.01" value={qState.theta}
            onChange={(e) => setThetaDirect(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer" />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>0 (|0⟩)</span><span>π/2 (Equator)</span><span>π (|1⟩)</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300">φ (Relative Phase):</span>
            <span className="text-purple-400 font-bold">{(qState.phi / Math.PI).toFixed(2)}π ({phiDeg}°)</span>
          </div>
          <input type="range" min="0" max="6.2831853" step="0.01" value={qState.phi}
            onChange={(e) => setPhiDirect(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer" />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>0 (+x)</span><span>π/2 (+y)</span><span>π (-x)</span><span>2π</span>
          </div>
        </div>
      </div>

      {/* Canonical Eigenstates */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="text-xs font-semibold text-slate-300">Canonical Eigenstates</div>
        <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
          <button onClick={() => setDirectSpherical(0, 0)} className="py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 transition">|0⟩ (Z+)</button>
          <button onClick={() => setDirectSpherical(Math.PI, 0)} className="py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 transition">|1⟩ (Z-)</button>
          <button onClick={() => setDirectSpherical(Math.PI / 2, 0)} className="py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 transition">|+⟩ (X+)</button>
          <button onClick={() => setDirectSpherical(Math.PI / 2, Math.PI)} className="py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 transition">|-⟩ (X-)</button>
          <button onClick={() => setDirectSpherical(Math.PI / 2, Math.PI / 2)} className="py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-amber-300 transition">|+i⟩ (Y+)</button>
          <button onClick={() => setDirectSpherical(Math.PI / 2, 3 * Math.PI / 2)} className="py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-amber-300 transition">|-i⟩ (Y-)</button>
        </div>
      </div>

      {/* Gates */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Binary className="w-3.5 h-3.5" /> Single-Qubit Unitary Gates
          </span>
          <span className="text-[11px] text-slate-500">SU(2)</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
          {[
            { g: 'X', label: 'Bit Flip', cls: 'border-rose-500/30 hover:bg-rose-950/30 text-rose-300' },
            { g: 'Y', label: 'π rot Y', cls: 'border-amber-500/30 hover:bg-amber-950/30 text-amber-300' },
            { g: 'Z', label: 'Phase Flip', cls: 'border-cyan-500/30 hover:bg-cyan-950/30 text-cyan-300' },
            { g: 'H', label: 'Hadamard', cls: 'border-purple-500/30 hover:bg-purple-950/30 text-purple-300' },
            { g: 'S', label: 'π/2 Z', cls: 'border-indigo-500/30 hover:bg-indigo-950/30 text-indigo-300' },
            { g: 'S_DAG', label: '-π/2 Z', cls: 'border-indigo-500/30 hover:bg-indigo-950/30 text-indigo-300', display: 'S†' },
            { g: 'T', label: 'π/4 Z', cls: 'border-pink-500/30 hover:bg-pink-950/30 text-pink-300' },
            { g: 'T_DAG', label: '-π/4 Z', cls: 'border-pink-500/30 hover:bg-pink-950/30 text-pink-300', display: 'T†' },
          ].map(({ g, label, cls, display }) => (
            <button key={g} onClick={() => executeGate(g)}
              className={`px-1 py-2 rounded-lg bg-slate-900 border ${cls} font-bold transition flex flex-col items-center`}>
              <span>{display || g}</span>
              <span className="text-[10px] leading-tight whitespace-nowrap tracking-tight text-slate-400 font-normal">{label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 font-mono">Continuous Rotations (δ = π/4):</span>
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => executeRotationAxis('x', Math.PI / 4)} className="py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-400 text-xs font-mono text-cyan-200">R_x(π/4)</button>
            <button onClick={() => executeRotationAxis('y', Math.PI / 4)} className="py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-400 text-xs font-mono text-amber-200">R_y(π/4)</button>
            <button onClick={() => executeRotationAxis('z', Math.PI / 4)} className="py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-400 text-xs font-mono text-purple-200">R_z(π/4)</button>
          </div>
        </div>
      </div>

      {/* Measurement Engine */}
      <div className="glass-panel p-3.5 rounded-xl border border-rose-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Quantum Measurement Engine
          </span>
          <span className="text-[11px] text-slate-500 text-right shrink-0">Von Neumann &amp; Weak</span>
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400 font-mono">Sharp Projective Measurement:</span>
          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
            <button onClick={() => handleMeasure('Z')} className="py-1.5 bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/60 rounded-lg text-rose-200">Z-Basis</button>
            <button onClick={() => handleMeasure('X')} className="py-1.5 bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/60 rounded-lg text-rose-200">X-Basis</button>
            <button onClick={() => handleMeasure('Y')} className="py-1.5 bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/60 rounded-lg text-rose-200">Y-Basis</button>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-amber-300 font-mono">Continuous Weak Measurement (Z):</span>
            <button onClick={toggleWeakMeasurement}
              className={`shrink-0 whitespace-nowrap px-2 py-0.5 rounded border font-mono ${isWeakMeasuring ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'}`}>
              {isWeakMeasuring ? 'Halt POVM' : 'Start Diffusion'}
            </button>
          </div>
          <p className="text-[10.5px] text-slate-400 leading-tight">
            Simulates stochastic quantum trajectory diffusion with weak Kraus operators showing gradual wave-function collapse.
          </p>
        </div>

        <div className={`text-center text-[11px] font-mono py-1 rounded bg-slate-900 border border-slate-800 ${measuring ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
          {measureLog}
        </div>
      </div>
    </div>
  );
}
