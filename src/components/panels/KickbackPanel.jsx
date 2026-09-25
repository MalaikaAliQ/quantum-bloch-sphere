import { useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import { useQuantumStore, execKickbackStep } from '../../store/quantumStore';
import KaTeXBlock from '../KaTeXBlock';
import katex from 'katex';

const STEP_DESCRIPTIONS = [
  'Step 1: System initialized. Target qubit q₁ set to state |1⟩.',
  'Step 2: Hadamards applied! Control is |+⟩, Target is |−⟩ (an eigenstate of Pauli X with eigenvalue λ = −1).',
  'Step 3: CNOT Phase Kickback! The eigenvalue −1 = e^{iπ} migrates to the control qubit (|+⟩ → |−⟩). Notice the target remains unchanged!',
  'Step 4: Final Hadamard on control qubit maps |−⟩ → |1⟩. Measurement of q₀ yields |1⟩ with 100% certainty!',
];

const STEP_LATEX = [
  '|01\\rangle',
  '|+\\rangle|{-}\\rangle',
  'C\\text{-}X \\to |{-}\\rangle|{-}\\rangle',
  'H|{-}\\rangle = |1\\rangle',
];

export default function KickbackPanel() {
  const { kickbackStep } = useQuantumStore();
  const statusRef = useRef(null);

  useEffect(() => {
    if (statusRef.current) {
      // Re-render katex in the status box whenever step changes
      const el = statusRef.current;
      const mathParts = el.querySelectorAll('[data-katex]');
      mathParts.forEach(span => {
        try {
          katex.render(span.getAttribute('data-katex'), span, { displayMode: false, throwOnError: false });
        } catch {}
      });
    }
  }, [kickbackStep]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/20 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Phase Kickback Laboratory
        </span>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          When target qubit q₁ is an eigenstate of unitary operator U, a controlled operation C-U migrates the relative phase factor directly onto the control qubit:
        </p>
        <div className="p-2 rounded bg-slate-900 border border-cyan-900/40 text-[10px] font-mono text-cyan-300">
          <KaTeXBlock math="C\\text{-}U\\left[\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}|u\\rangle\\right] = \\left[\\frac{|0\\rangle + e^{i\\phi}|1\\rangle}{\\sqrt{2}}\\right]|u\\rangle" />
        </div>
      </div>

      <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="text-xs font-bold text-slate-200">Interactive Circuit Protocol:</div>
        <div className="space-y-1.5">
          {[1, 2, 3, 4].map(step => {
            const labels = [
              '1. Initialize q₀ = |0⟩, Target q₁ = |1⟩',
              '2. Hadamard H⊗²: q₀ → |+⟩, q₁ → |−⟩',
              '3. Controlled-X (CNOT): Phase −1 Kicks Back!',
              '4. Readout Hadamard: H q₀ → |1⟩ (100% Deterministic)',
            ];
            const isActive = kickbackStep === step;
            return (
              <button key={step} onClick={() => execKickbackStep(step)}
                className={`w-full text-left p-2 rounded-lg border text-xs font-mono transition ${
                  isActive
                    ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300 ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400'
                }`}>
                {labels[step - 1]}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={statusRef} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed">
        {kickbackStep === 3 && <span className="text-rose-400 font-bold">⚡ </span>}
        {STEP_DESCRIPTIONS[kickbackStep - 1]}
        <div className="mt-1 text-center">
          <KaTeXBlock math={STEP_LATEX[kickbackStep - 1]} display={false} className="text-cyan-300" />
        </div>
      </div>
    </div>
  );
}
