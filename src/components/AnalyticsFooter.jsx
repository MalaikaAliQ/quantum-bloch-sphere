import { useEffect, useRef } from 'react';
import { useQuantumStore } from '../store/quantumStore';
import KaTeXBlock from './KaTeXBlock';

export default function AnalyticsFooter() {
  const { qState } = useQuantumStore();
  const phasorRef = useRef(null);

  const theta = qState.theta;
  const phi = qState.phi;
  const r = qState.radius;

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
  let entropy = 0;
  if (l1 > 1e-10 && l1 < 0.999999) {
    entropy = -(l1 * Math.log2(l1) + l2 * Math.log2(l2));
  }

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

    ctx.clearRect(0, 0, w, h);

    // Guide ring
    ctx.strokeStyle = '#334155';
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
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + cosHalf * rad, cy);
    ctx.stroke();

    // Beta phasor
    const bLen = sinHalf * rad;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + bLen * Math.cos(-phi), cy + bLen * Math.sin(-phi));
    ctx.stroke();
  }, [cosHalf, sinHalf, phi]);

  const matrixLatex = `\\rho = \\begin{pmatrix} ${rho00} & ${offDiag01} \\\\ ${offDiag10} & ${rho11} \\end{pmatrix}`;

  return (
    <div className="absolute bottom-4 left-4 right-4 glass-panel rounded-2xl p-4 border border-cyan-500/20 z-10 shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">

        {/* Column 1: State Vector */}
        <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:pr-4">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center justify-between">
            <span>State Vector |ψ⟩</span>
            <span className="text-cyan-400 font-bold">[{rx}, {ry}, {rz}]</span>
          </div>
          <div className="text-xs text-cyan-200 overflow-x-auto py-1">
            <KaTeXBlock math={`|\\psi\\rangle = \\cos(\\frac{\\theta}{2})|0\\rangle + e^{i\\phi}\\sin(\\frac{\\theta}{2})|1\\rangle`} display={false} />
          </div>
          <div className="text-[11px] text-slate-300">
            <KaTeXBlock math={`|\\psi\\rangle = ${stateStr}`} display={false} />
          </div>
        </div>

        {/* Column 2: Complex Amplitudes & Phasor */}
        <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:pr-4">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center justify-between">
            <span>Complex Amplitudes</span>
            <span className="text-[10px] text-slate-500">Phasor Plane</span>
          </div>
          <div className="flex items-center gap-3">
            <canvas ref={phasorRef} width={60} height={60} className="rounded-full bg-slate-900 border border-slate-800 shrink-0" />
            <div className="text-[10px] space-y-0.5 leading-tight">
              <div>α = <span className="text-cyan-300">{cosHalf.toFixed(3)} ∠ 0°</span></div>
              <div>β = <span className="text-purple-300">{sinHalf.toFixed(3)} ∠ {Math.round(phi * 180 / Math.PI)}°</span></div>
              <div className="text-slate-400 text-[9px] pt-1">Δφ = <span className="text-amber-300">{Math.round(phi * 180 / Math.PI)}°</span></div>
            </div>
          </div>
        </div>

        {/* Column 3: Probabilities */}
        <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:pr-4">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Measurement Probabilities
          </div>
          <div>
            <div className="flex justify-between text-[11px]">
              <span className="text-cyan-300">P(|0⟩) = |α|²</span>
              <span className="text-slate-200 font-bold">{(p0 * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-cyan-400 transition-all duration-150" style={{ width: `${p0 * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px]">
              <span className="text-rose-400">P(|1⟩) = |β|²</span>
              <span className="text-slate-200 font-bold">{(p1 * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-rose-500 transition-all duration-150" style={{ width: `${p1 * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Column 4: Density Matrix */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            <span>Density Matrix ρ</span>
            <span className="text-purple-300 font-bold">γ={purity} | S={entropy.toFixed(2)}</span>
          </div>
          <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80 font-mono text-[10px] text-purple-200 overflow-x-auto">
            <KaTeXBlock math={matrixLatex} display={true} />
          </div>
        </div>

      </div>
    </div>
  );
}
