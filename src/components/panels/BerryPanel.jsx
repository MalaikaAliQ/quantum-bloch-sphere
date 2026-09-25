import { Triangle, Play } from 'lucide-react';
import { startBerryLoopAnimation, clearBerryLoop } from '../../store/quantumStore';
import KaTeXBlock from '../KaTeXBlock';

export default function BerryPanel() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Triangle className="w-3.5 h-3.5" /> Geometric &amp; Berry Phase
        </span>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          When a qubit undergoes a cyclic adiabatic or geodesic evolution along a closed trajectory C on the Bloch sphere, it acquires an invariant geometric phase γ_g directly equal to half the enclosed solid angle Ω:
        </p>
        <div className="p-2 rounded bg-slate-900/90 border border-cyan-900/50 text-[11px] font-mono text-cyan-300 text-center">
          <KaTeXBlock math={"\\gamma_g = -\\frac{1}{2}\\Omega(C) = -\\frac{1}{2}\\oint_C (1 - \\cos\\theta)\\,d\\phi"} />
        </div>
      </div>

      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-3">
        <div className="text-xs font-bold text-slate-200">Standard Canonical Closed Loop:</div>
        <div className="text-[11px] text-slate-400 font-mono">
          Path: |0⟩ → |+⟩ → |+i⟩ → |0⟩ (Octant Triangle)
        </div>
        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Solid Angle Enclosed Ω:</span>
            <span className="text-purple-300 font-bold">π/2 sr ≈ 1.571</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Geometric Phase γ_g:</span>
            <span className="text-cyan-300 font-bold">-π/4 rad (-45°)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Phase Accumulation:</span>
            <span className="text-emerald-300 font-bold">
              <KaTeXBlock math={"e^{i\\gamma_g} = \\frac{1-i}{\\sqrt{2}}"} display={false} />
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={startBerryLoopAnimation}
            className="py-2 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition">
            <Play className="w-3.5 h-3.5" /> Traverse Loop
          </button>
          <button onClick={clearBerryLoop}
            className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition">
            Reset Loop
          </button>
        </div>
      </div>
    </div>
  );
}
