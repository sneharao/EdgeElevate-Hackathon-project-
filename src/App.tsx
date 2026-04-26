/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Zap, ArrowRight } from 'lucide-react';
import { AnalysisFlow } from './components/AnalysisFlow';
import { Dashboard } from './components/Dashboard';
import { streamEdgeElevateAnalysis } from './services/edgeElevateApi';
import type { EdgeElevateResponse } from './types/edgeElevate';

export default function App() {
  const [startupName, setStartupName] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [currentStep, setCurrentStep] = useState<string>('resolve_project');
  const [resultData, setResultData] = useState<EdgeElevateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startupName) return;

    setStatus('analyzing');
    setCurrentStep('resolve_project');
    setError(null);

    try {
      const cleanup = streamEdgeElevateAnalysis(
        startupName,
        (stepUpdate) => {
          setCurrentStep(stepUpdate.step);
        },
        (result) => {
          setResultData(result);
          setCurrentStep('complete');
          setTimeout(() => setStatus('complete'), 500);
        },
        (err) => {
          console.error('Analysis error:', err);
          setError(err.message);
          setStatus('idle');
        }
      );

      return () => cleanup();
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen landing-bg overflow-x-hidden">
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 relative landing-bg"
          >
            {/* Background elements */}
            <div className="absolute inset-0 technical-grid opacity-40 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent)]/[0.03] blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-[var(--accent-cyan)]/[0.02] blur-[120px] rounded-full pointer-events-none" />

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 mb-20"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-cyan)] rounded-2xl flex items-center justify-center shadow-lg glow-primary">
                <Zap className="text-[var(--color-on-primary)]" size={28} fill="currentColor" />
              </div>
              <h1 className="text-4xl font-light tracking-tight text-[var(--ink)]">
                EdgeElevate <span className="text-[var(--ink-muted)] font-thin">/ displacement engine</span>
              </h1>
            </motion.div>

            {/* Main Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl w-full"
            >
              <form onSubmit={startAnalysis} className="flex flex-col gap-8">
                <div className="relative group">
                  <div className="landing-input-glow group-focus-within:landing-input-glow-active"></div>
                  <div className="relative glass-panel-elevated rounded-2xl flex items-center p-3 transition-all">
                    <div className="flex-1 px-4 flex items-center gap-4">
                      <Search className="text-[var(--ink-muted)]" size={20} />
                      <input
                        type="text"
                        placeholder="TARGET STARTUP OR BRAND"
                        value={startupName}
                        onChange={(e) => setStartupName(e.target.value.toUpperCase())}
                        className="bg-transparent border-none outline-none text-[var(--ink)] w-full font-mono text-sm uppercase tracking-widest placeholder:text-[var(--ink-muted)]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!startupName}
                      className="btn-primary px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest shrink-0 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      RUN_SOLVER <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Indicators */}
                <div className="flex justify-between items-center px-4">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <span className="status-dot status-dot-success status-dot-pulse"></span>
                      <span className="text-[10px] text-[var(--ink-muted)] font-mono uppercase tracking-widest">Engine Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="status-dot status-dot-primary"></span>
                      <span className="text-[10px] text-[var(--ink-muted)] font-mono uppercase tracking-widest">Tracing v2.0 Active</span>
                    </div>
                  </div>
                  <div className="minimal-badge text-[10px] uppercase tracking-widest px-2 py-0.5 rounded">BETA_RELEASE</div>
                </div>
              </form>
            </motion.div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 max-w-2xl w-full"
              >
                <div className="glass-panel-elevated border border-red-500/20 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-xs font-mono text-red-400 uppercase tracking-wider mb-2">Pipeline Error</p>
                      <p className="text-sm text-[var(--ink)] font-mono">{error}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Example links */}
            <div className="mt-32 space-y-6 text-center">
              <p className="text-[10px] text-[var(--ink-muted)] font-mono uppercase tracking-[0.4em]">Quick Analysis Nodes</p>
              <div className="flex flex-wrap justify-center gap-8">
                {['NOTHING', 'ATTIO', 'REVOLUT', 'BMW', 'MINDSPACE', 'LEGORA'].map((name) => (
                  <button
                    key={name}
                    onClick={() => setStartupName(name)}
                    className="text-[11px] font-mono text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors uppercase tracking-[0.2em] border-b border-transparent hover:border-[var(--accent)] pb-1 cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        )}

        {status === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center landing-bg"
          >
            <div className="w-full">
              <AnalysisFlow currentStep={currentStep} error={error} />
            </div>
          </motion.div>
        )}

        {status === 'complete' && resultData && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen landing-bg"
          >
            <Dashboard data={resultData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
