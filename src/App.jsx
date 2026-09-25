import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Atom, Compass, Triangle, Activity, ShieldAlert, GitMerge, Zap,
  BookOpen, RefreshCw, Sun, Moon,
} from 'lucide-react';
import {
  useQuantumStore, setActiveModule, setAnimSpeed,
  setShowTrails, setShowProjections, executeGate,
} from './store/quantumStore';

import BlochScene from './components/BlochScene';
import AnalyticsFooter from './components/AnalyticsFooter';
import StandardPanel from './components/panels/StandardPanel';
import BerryPanel from './components/panels/BerryPanel';
import LarmorPanel from './components/panels/LarmorPanel';
import OpenSystemPanel from './components/panels/OpenSystemPanel';
import EntanglePanel from './components/panels/EntanglePanel';
import KickbackPanel from './components/panels/KickbackPanel';
import InfoModal from './components/InfoModal';

const MODULES = [
  { id: 'standard', label: 'Single Qubit', short: 'Qubit', Icon: Compass },
  { id: 'berry', label: 'Berry Phase', short: 'Berry', Icon: Triangle },
  { id: 'larmor', label: 'Larmor & Rabi', short: 'Larmor', Icon: Activity },
  { id: 'open', label: 'Open Sys & Decoherence', short: 'Decoherence', Icon: ShieldAlert },
  { id: 'entangle', label: 'Entanglement', short: 'Entangle', Icon: GitMerge },
  { id: 'kickback', label: 'Phase Kickback', short: 'Kickback', Icon: Zap },
];

export default function App() {
  const { activeModule, showTrails, showProjections, animSpeed } = useQuantumStore();
  const [infoOpen, setInfoOpen] = useState(false);
  const [detuning, setDetuning] = useState(0);
  const [rabiFreq, setRabiFreq] = useState(1.2);
  const sceneRef = useRef(null);
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('qbs-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);

  const handleModuleChange = useCallback((mod) => {
    setActiveModule(mod);
    if (sceneRef.current?.current?.clearTrail) {
      sceneRef.current.current.clearTrail();
    }
  }, []);

  const resetCamera = useCallback(() => {
    if (sceneRef.current?.current?.resetCamera) {
      sceneRef.current.current.resetCamera();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key.toLowerCase()) {
        case 'x': executeGate('X'); break;
        case 'y': executeGate('Y'); break;
        case 'z': executeGate('Z'); break;
        case 'h': executeGate('H'); break;
        case 's': executeGate('S'); break;
        case 't': executeGate('T'); break;
        case 'r': resetCamera(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [resetCamera]);

  return (
    <div className="w-screen h-screen flex flex-col text-slate-100 bg-slate-950 overflow-hidden">

      {/* TOP NAV HEADER */}
      <header className="h-14 border-b border-cyan-500/20 bg-slate-900/85 backdrop-blur px-4 flex items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Atom className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-wider text-slate-100 flex items-center gap-2 whitespace-nowrap">
              QUANTUM BLOCH SPHERE
              <span className="hidden 2xl:inline text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold tracking-wider border border-cyan-500/30">
                MASTER &amp; GRAD SUITE
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden 2xl:block whitespace-nowrap">
              Geometry, Open Dynamics, Berry Phase, Entanglement &amp; Kickback
            </p>
          </div>
        </div>

        {/* Module Selector */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
          {MODULES.map(({ id, label, short, Icon }) => (
            <button key={id} onClick={() => handleModuleChange(id)} title={label}
              className={`px-2.5 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                activeModule === id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden 2xl:inline">{label}</span>
              <span className="hidden lg:inline 2xl:hidden">{short}</span>
            </button>
          ))}
        </nav>

        {/* Quick Utils */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button onClick={() => setInfoOpen(true)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" title="Graduate Lecture Compendium">
            <BookOpen className="w-4 h-4" />
          </button>
          <button onClick={resetCamera}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" title="Reset Viewport">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex overflow-hidden relative">

        {/* LEFT SIDEBAR */}
        <aside className="w-80 md:w-96 flex flex-col border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-md z-20 h-full overflow-hidden shrink-0">
          {activeModule === 'standard' && <StandardPanel />}
          {activeModule === 'berry' && <BerryPanel />}
          {activeModule === 'larmor' && <LarmorPanel detuning={detuning} rabiFreq={rabiFreq} onDetuningChange={setDetuning} onRabiChange={setRabiFreq} />}
          {activeModule === 'open' && <OpenSystemPanel />}
          {activeModule === 'entangle' && <EntanglePanel />}
          {activeModule === 'kickback' && <KickbackPanel />}

          {/* Bottom strip */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 text-[11px] flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> SU(2) Engine Active
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={showTrails} onChange={(e) => setShowTrails(e.target.checked)} className="accent-cyan-500" />
              <span>Orbit trails</span>
            </label>
          </div>
        </aside>

        {/* 3D VIEWPORT */}
        <div className="flex-1 relative bg-slate-950 flex flex-col min-w-0">
          <BlochScene theme={theme} detuning={detuning} rabiFreq={rabiFreq} onLabelsReady={(ref) => { sceneRef.current = ref; }} />

          {/* HUD Overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 pointer-events-auto">
            <div className="glass-panel px-3 py-2 rounded-xl text-xs flex items-center gap-3">
              <span className="text-slate-300 text-[11px]">Render speed</span>
              <input type="range" min="0.5" max="3" step="0.25" value={animSpeed}
                onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
                className="w-20 h-1.5" />
            </div>
            <div className="glass-panel px-3 py-2 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
              <span className="text-slate-300">Equatorial projections</span>
              <input type="checkbox" checked={showProjections}
                onChange={(e) => setShowProjections(e.target.checked)}
                className="accent-cyan-500" />
            </div>
          </div>

          {/* Analytics Footer */}
          <AnalyticsFooter theme={theme} />
        </div>
      </main>

      {/* Info Modal */}
      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
    </div>
  );
}
