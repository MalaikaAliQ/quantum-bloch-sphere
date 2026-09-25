import { ShieldAlert } from 'lucide-react';
import { applyDecoherenceStep, purifyState } from '../../store/quantumStore';
import KaTeXBlock from '../KaTeXBlock';

export default function OpenSystemPanel() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" /> Lindblad Master Equation
        </span>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Decoherence maps pure surface states |r⃗|=1 into the interior |r⃗| &lt; 1:
        </p>
        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-purple-200">
          <KaTeXBlock math="\\dot{\\rho} = -\\frac{i}{\\hbar}[H, \\rho] + \\sum_k \\left( L_k \\rho L_k^\\dagger - \\frac{1}{2}\\{L_k^\\dagger L_k, \\rho\\} \\right)" />
        </div>
      </div>

      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-3">
        <div className="text-xs font-semibold text-slate-200">Decoherence Channels:</div>

        {/* T1 Amplitude Damping */}
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-rose-300">T₁ Amplitude Damping:</span>
            <button onClick={() => applyDecoherenceStep('t1')}
              className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-[10px] text-rose-300">Step Δt</button>
          </div>
          <p className="text-[10px] text-slate-400">
            Jump operator L = √γ₁σ₋. Decays energy down to thermal ground state |0⟩.
          </p>
        </div>

        {/* T2* Pure Dephasing */}
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-indigo-300">T₂* Pure Dephasing:</span>
            <button onClick={() => applyDecoherenceStep('t2')}
              className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/40 text-[10px] text-indigo-300">Step Δt</button>
          </div>
          <p className="text-[10px] text-slate-400">
            Jump operator L = √(γ_φ/2)σ_z. Destroys equatorial coherence, vector contracts into the Z-axis.
          </p>
        </div>

        {/* Depolarizing Channel */}
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-amber-300">Depolarizing Channel:</span>
            <button onClick={() => applyDecoherenceStep('depolar')}
              className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-[10px] text-amber-300">Step Δt</button>
          </div>
          <p className="text-[10px] text-slate-400">
            ρ → (1-p)ρ + (p/2)I. Contracts uniformly towards the maximally mixed center r⃗ = 0⃗.
          </p>
        </div>

        <button onClick={purifyState}
          className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 transition">
          Purify State (|r⃗| → 1.0)
        </button>
      </div>
    </div>
  );
}
