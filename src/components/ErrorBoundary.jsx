import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Quantum Bloch Sphere Caught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 font-sans">
          <div className="max-w-lg w-full glass-panel p-6 rounded-2xl border border-rose-500/30 shadow-2xl text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold tracking-wide text-slate-100 font-mono">
              QUANTUM SYSTEM INTERRUPT
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              A graphics or state execution exception occurred during simulation render.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition font-mono shadow-lg"
            >
              <RefreshCw className="w-4 h-4" /> Re-Initialize Quantum Engine
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
