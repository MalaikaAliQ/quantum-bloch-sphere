import { GitMerge } from 'lucide-react';
import { useQuantumStore, setEntanglementConcurrence } from '../../store/quantumStore';
import KaTeXBlock from '../KaTeXBlock';

export default function EntanglePanel() {
  const { qState } = useQuantumStore();

  const concurrence = parseFloat(document.getElementById?.('concurrence-slider-react')?.value || 0);

  // Compute from current state
  const r = qState.radius;
  const rz = r * Math.cos(qState.theta);
  const p = (1 - Math.abs(rz)) / 2;
  let entropy = 0;
  if (p > 1e-6 && p < 0.999999) {
    entropy = -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 space-y-2">
        <span className="section-title text-cyan-300">
          <GitMerge className="w-3.5 h-3.5" /> Entanglement &amp; Reduced States
        </span>
        <p className="text-xs text-slate-300 leading-relaxed">
          When two qubits entangle, tracing out system B produces a mixed single-qubit state:
        </p>
        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-200">
          <KaTeXBlock math={"\\rho_A = (1-p)|0\\rangle\\langle 0| + p|1\\rangle\\langle 1| \\implies \\vec{r}_A = (0, 0, 1 - 2p)"} />
        </div>
      </div>

      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-3">
        <ConcurrenceSlider />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button onClick={() => { setEntanglementConcurrence(0); }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-[13px] text-cyan-300">
            Separable |00⟩
          </button>
          <button onClick={() => { setEntanglementConcurrence(1); }}
            className="p-2 rounded-lg bg-slate-900 border border-rose-500/30 hover:border-rose-500 text-[13px] text-rose-300">
            Maximal Bell State
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Bloch Vector Length |r⃗_A|:</span>
            <span className="font-mono text-cyan-300 font-semibold">{r.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Subsystem Entropy S(ρ_A):</span>
            <span className="font-mono text-amber-300 font-semibold">{entropy.toFixed(3)} bits</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConcurrenceSlider() {
  const { qState } = useQuantumStore();
  // Derive concurrence from radius: C = sqrt(1 - r^2)
  const c = Math.sqrt(Math.max(0, 1 - qState.radius * qState.radius));

  const label = c >= 0.99 ? 'Maximal Bell' : c <= 0.01 ? 'Product State' : 'Entangled';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[13px] items-baseline">
        <span className="field-label">Concurrence C:</span>
        <span className="value text-rose-400">{c.toFixed(2)} ({label})</span>
      </div>
      <input type="range" id="concurrence-slider-react" min="0" max="1" step="0.02" value={c}
        onChange={(e) => setEntanglementConcurrence(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer" />
      <div className="flex justify-between text-xs text-slate-500 font-mono">
        <span>0 (Product |00⟩)</span><span>0.5</span><span>1.0 (Bell State Φ+)</span>
      </div>
    </div>
  );
}
