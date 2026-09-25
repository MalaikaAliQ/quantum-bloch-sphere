import { GraduationCap, X } from 'lucide-react';
import KaTeXBlock from './KaTeXBlock';

export default function InfoModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-4xl max-h-[85vh] rounded-2xl border border-cyan-500/30 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Quantum Qubit Mechanics &amp; Bloch Geometry Compendium</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
              1. The Hopf Fibration &amp; Pure Qubit Geometry (S³ → S²)
            </h3>
            <p>
              A pure state in ℂ² is written as |ψ⟩ = c₀|0⟩ + c₁|1⟩ with |c₀|² + |c₁|² = 1. Factoring out an overall unobservable global phase, any state is mapped to coordinates on the unit sphere:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-200">
              <KaTeXBlock math="|\\psi\\rangle = \\cos\\left(\\frac{\\theta}{2}\\right)|0\\rangle + e^{i\\phi}\\sin\\left(\\frac{\\theta}{2}\\right)|1\\rangle" />
            </div>
            <p>
              The Bloch vector r⃗ = (rₓ, rᵧ, r_z) = (sinθcosφ, sinθsinφ, cosθ) represents the expectation values of the Pauli spin vector.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-purple-300 flex items-center gap-1.5 font-mono">
              2. Open Systems, Density Operators &amp; Decoherence
            </h3>
            <p>
              Ensembles or qubits coupled to an external bath are characterized by density operators ρ = ½(I + r⃗·σ⃗). The length of the Bloch vector characterizes state mixedness:
            </p>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-300">
              <li><strong>Pure State:</strong> |r⃗| = 1 ⟺ Tr(ρ²) = 1, Von Neumann entropy S(ρ) = 0.</li>
              <li><strong>Mixed State:</strong> |r⃗| &lt; 1 ⟺ Tr(ρ²) = ½(1 + |r⃗|²) &lt; 1.</li>
              <li><strong>Maximally Mixed:</strong> r⃗ = 0⃗ ⟺ ρ = ½I, S(ρ) = 1 bit.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5 font-mono">
              3. Pancharatnam-Berry Geometric Phase
            </h3>
            <p>
              Under adiabatic cyclic transport along curve C, the quantum state acquires both a dynamic phase and a geometric Berry phase γ_g. On the Bloch sphere, γ_g equals half the enclosed solid angle subtended at the origin: γ_g = −½Ω(C).
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-1.5 font-mono">
              4. Quantum Entanglement &amp; Monogamy
            </h3>
            <p>
              For a pure bipartite system, tracing out system B yields the reduced state. For a maximally entangled Bell state (p=0.5), the single qubit reduced Bloch vector vanishes completely into the center (r⃗_A = 0⃗).
            </p>
          </section>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition">
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
