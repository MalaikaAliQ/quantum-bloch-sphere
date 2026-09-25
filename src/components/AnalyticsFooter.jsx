import { useEffect, useRef } from 'react';
import { useQuantumStore } from '../store/quantumStore';
import KaTeXBlock from './KaTeXBlock';

const PHASOR_COLORS = {
  dark: { guide: '#64748b', alpha: '#06b6d4', beta: '#a855f7' },
  light: { guide: '#94a3b8', alpha: '#0891b2', beta: '#7c3aed' },
};

export default function AnalyticsFooter({ theme = 'dark' }) {
  const { qState } = useQuantumStore();
  const phasorRef = useRef(null);

  const theta = qState?.theta ?? 0;
  const phi = qState?.phi ?? 0;
  const r = qState?.radius ?? 1.0;

  const cosHalf = Math.cos(theta / 2);
  const sinHalf = Math.sin(theta / 2);
  const alphaReal = cosHalf;
  const betaReal = Math.cos(phi) * sinHalf;
  const betaImag = Math.sin(phi) * sinHalf;

  const p0 = Math.max(0, Math.min(1, cosHalf * cosHalf));
  const p1 = Math.max(0, Math.min(1, sinHalf * sinHalf));

  const rx = (r * Math.sin(theta) * Math.cos(phi)).toFixed(3);
  const ry = (r * Math.sin(theta) * Math.sin(phi)).toFixed(3);
  const rz = (r * Math.cos(theta)).toFixed(3);

  // Density matrix
  const rho00 = ((1 + parseFloat(rz)) / 2).toFixed(2);
  const rho11 = ((1 - parseFloat(rz)) / 2).toFixed(2);
  const rho01Real = (parseFloat(rx) / 2).toFixed(2);
  const rho01Imag = (-parseFloat(ry) / 2).toFixed(2);

  let offDiag01 = `${rho01Real}`;
  if (Math.abs(parseFloat(rho01Imag)) > 0.01) {
    offDiag01 += `${parseFloat(rho01Imag) >= 0 ? '+' : ''}${rho01Imag}i`;
  }
  let offDiag10 = `${rho01Real}`;
  if (Math.abs(parseFloat(rho01Imag)) > 0.01) {
    offDiag10 += `${parseFloat(rho01Imag) <= 0 ? '+' : ''}${(-parseFloat(rho01Imag)).toFixed(2)}i`;
  }

  const purity = (0.5 * (1 + r * r)).toFixed(2);
  const l1 = Math.max(1e-12, (1 + r) / 2);
  const l2 = Math.max(1e-12, (1 - r) / 2);
  let rawEntropy = 0;
  if (l1 > 1e-10 && l1 < 0.999999) {
    rawEntropy = -(l1 * Math.log2(l1) + l2 * Math.log2(l2));
  }
  const entropy = Number.isFinite(rawEntropy) ? rawEntropy.toFixed(2) : '0.00';

  // State string
  const betaSign = betaImag >= 0 ? '+' : '-';
  let stateStr = `${alphaReal.toFixed(3)}|0\\rangle + `;
  if (Math.abs(betaImag) < 0.001) {
    stateStr += `${betaReal.toFixed(3)}|1\\rangle`;
  } else {
    stateStr += `(${betaReal.toFixed(3)} ${betaSign} ${Math.abs(betaImag).toFixed(3)}i)|1\\rangle`;
  }

  // Phasor canvas
  useEffect(() => {
    const cvs = phasorRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const w = cvs.width, h = cvs.height;
    const cx = w / 2, cy = h / 2;
    const rad = w * 0.42;

    const palette = PHASOR_COLORS[theme] || PHASOR_COLORS.dark;
    ctx.clearRect(0, 0, w, h);

    // Guide ring
    ctx.strokeStyle = palette.guide;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, 2 * Math.PI);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - rad, cy); ctx.lineTo(cx + rad, cy);
    ctx.moveTo(cx, cy - rad); ctx.lineTo(cx, cy + rad);
    ctx.stroke();

    // Alpha phasor
    ctx.strokeStyle = palette.alpha;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + cosHalf * rad, cy);
    ctx.stroke();

    // Beta phasor
    const bLen = sinHalf * rad;
    ctx.strokeStyle = palette.beta;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + bLen * Math.cos(-phi), cy + bLen * Math.sin(-phi));
    ctx.stroke();
  }, [cosHalf, sinHalf, phi, theme]);

  const matrixLatex = `\\rho = \\begin{pmatrix} ${rho00} & ${offDiag01} \\\\ ${offDiag10} & ${rho11} \\end{pmatrix}`;

  // Columns sit 2×2 below 1536px wide so formulas and headings are never clipped
  const col = 'min-w-0 space-y-2 2xl:border-r 2xl:border-slate-800 2xl:pr-5';
  const degPhi = Math.round(phi * 180 / Math.PI);

  return (
    <div id="analytics-footer" className="absolute bottom-4 left-4 right-4 glass-panel rounded-2xl px-5 py-3.5 border border-cyan-500/20 z-10 shadow-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-x-6 gap-y-3 text-[13px]">

        {/* Column 1: State Vector */}
        <div className={col}>
          <div className="section-title text-slate-400 justify-between flex-wrap gap-x-3">
            <span className="whitespace-nowrap">State vector |ψ⟩</span>
            <span className="font-mono text-xs text-cyan-300 font-semibold whitespace-nowrap normal-case tracking-normal tabular-nums">[{rx}, {ry}, {rz}]</span>
          </div>
          <div className="math-row text-slate-200 overflow-x-auto overflow-y-hidden">
            <KaTeXBlock math={`|\\psi\\rangle = \\cos(\\tfrac{\\theta}{2})|0\\rangle + e^{i\\phi}\\sin(\\tfrac{\\theta}{2})|1\\rangle`} display={false} />
          </div>
          <div className="math-row text-slate-200 overflow-x-auto overflow-y-hidden">
            <KaTeXBlock math={`|\\psi\\rangle = ${stateStr}`} display={false} />
          </div>
        </div>

        {/* Column 2: Complex Amplitudes & Phasor */}
        <div className={col}>
          <div className="section-title text-slate-400 justify-between gap-x-3">
            <span className="whitespace-nowrap">Complex amplitudes</span>
            <span className="normal-case tracking-normal font-normal text-slate-500 whitespace-nowrap">Phasor plane</span>
          </div>
          <div className="flex items-center gap-4">
            <canvas ref={phasorRef} width={64} height={64} className="rounded-full bg-slate-900 border border-slate-800 shrink-0" />
            <div className="font-mono text-[13px] space-y-1 leading-snug tabular-nums">
              <div className="text-slate-300">α = <span className="text-cyan-300 font-semibold">{cosHalf.toFixed(3)} ∠ 0°</span></div>
              <div className="text-slate-300">β = <span className="text-violet-300 font-semibold">{sinHalf.toFixed(3)} ∠ {degPhi}°</span></div>
              <div className="text-slate-400 text-xs">Δφ = <span className="text-amber-300 font-semibold">{degPhi}°</span></div>
            </div>
          </div>
        </div>

        {/* Column 3: Probabilities */}
        <div className={col}>
          <div className="section-title text-slate-400">
            <span className="whitespace-nowrap">Measurement probabilities</span>
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between font-mono text-[13px] tabular-nums">
                <span className="text-cyan-300">P(|0⟩) = |α|²</span>
                <span className="text-slate-100 font-bold">{(p0 * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-cyan-400 transition-all duration-150" style={{ width: `${p0 * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-mono text-[13px] tabular-nums">
                <span className="text-rose-300">P(|1⟩) = |β|²</span>
                <span className="text-slate-100 font-bold">{(p1 * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-rose-500 transition-all duration-150" style={{ width: `${p1 * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Density Matrix */}
        <div className="min-w-0 space-y-2">
          <div className="section-title text-slate-400 justify-between gap-x-3">
            <span className="whitespace-nowrap">Density matrix ρ</span>
            <span className="font-mono text-xs normal-case tracking-normal text-violet-300 font-semibold whitespace-nowrap tabular-nums">γ = {purity} · S = {entropy}</span>
          </div>
          <div className="math-row px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-200 overflow-x-auto overflow-y-hidden">
            <KaTeXBlock math={matrixLatex} display={true} />
          </div>
        </div>

      </div>
    </div>
  );
}
