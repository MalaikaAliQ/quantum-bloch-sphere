import { useState } from 'react';
import { Activity, Play, Pause } from 'lucide-react';
import { useQuantumStore, toggleLarmorSimulation, setLarmorFrame } from '../../store/quantumStore';
import KaTeXBlock from '../KaTeXBlock';

export default function LarmorPanel({ onDetuningChange, onRabiChange, detuning, rabiFreq }) {
  const { isLarmorRunning, larmorFrame } = useQuantumStore();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 space-y-2">
        <span className="section-title text-cyan-300">
          <Activity className="w-3.5 h-3.5" /> Magnetic Resonance &amp; Rabi
        </span>
        <p className="text-xs text-slate-300 leading-relaxed">
          Hamiltonian under a static magnetic field B₀ẑ and a transverse driving field:
        </p>
        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-200">
          <KaTeXBlock math={"H = \\frac{\\hbar\\omega_0}{2}\\sigma_z + \\frac{\\hbar\\Omega_R}{2}(\\sigma_x\\cos\\omega t + \\sigma_y\\sin\\omega t)"} />
        </div>
      </div>

      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-[13px] items-baseline">
            <span className="field-label">Detuning Δ = ω₀ - ω:</span>
            <span className="value text-cyan-300">{detuning.toFixed(2)} rad/s</span>
          </div>
          <input type="range" min="-3" max="3" step="0.1" value={detuning}
            onChange={(e) => onDetuningChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg" />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[13px] items-baseline">
            <span className="field-label">Rabi Drive Strength Ω_R:</span>
            <span className="value text-emerald-300">{rabiFreq.toFixed(2)} rad/s</span>
          </div>
          <input type="range" min="0" max="4" step="0.1" value={rabiFreq}
            onChange={(e) => onRabiChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg" />
        </div>

        <div className="flex items-center justify-between text-[13px] pt-1">
          <span className="field-label">Reference Frame:</span>
          <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button onClick={() => setLarmorFrame('rotating')}
              className={`px-2 py-1 rounded text-xs ${larmorFrame === 'rotating' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-100'}`}>
              Rotating
            </button>
            <button onClick={() => setLarmorFrame('lab')}
              className={`px-2 py-1 rounded text-xs ${larmorFrame === 'lab' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-100'}`}>
              Laboratory
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button onClick={toggleLarmorSimulation}
            className={`w-full py-2 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5 transition ${isLarmorRunning ? 'bg-amber-700 hover:bg-amber-600 text-white' : 'bg-emerald-700 hover:bg-emerald-600 text-white'}`}>
            {isLarmorRunning ? <><Pause className="w-3.5 h-3.5" /> Pause Evolution</> : <><Play className="w-3.5 h-3.5" /> Run Real-Time Evolution</>}
          </button>
        </div>
      </div>
    </div>
  );
}
