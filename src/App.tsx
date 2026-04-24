/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Zap, ArrowRight, Shield, TrendingUp, Cpu } from 'lucide-react';
import { AnalysisFlow } from './components/AnalysisFlow';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [startupName, setStartupName] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [currentStep, setCurrentStep] = useState<string>('research');
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupName) return;

    setStatus('analyzing');
    setCurrentStep('research');
    setError(null);

    // Simulated step transitions for the UI
    const steps = ['research', 'sentiment', 'insights', 'content'];
    
    try {
      // In a real app, the server would stream these chunks, 
      // but for MVP we call the single endpoint and simulate the UI steps.
      const timer = setInterval(() => {
        setCurrentStep(prev => {
          const idx = steps.indexOf(prev);
          if (idx < steps.length - 1) return steps[idx + 1];
          return prev;
        });
      }, 5000);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupName }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await response.json();
      clearInterval(timer);
      setResultData(data);
      setCurrentStep('complete');
      setTimeout(() => setStatus('complete'), 500);

    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-x-hidden selection:bg-accent/30">
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 relative bg-[#f8f9fa]"
          >
            {/* Background elements */}
            <div className="absolute inset-0 technical-grid opacity-50 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1a73e8]/[0.03] blur-[150px] rounded-full pointer-events-none" />

            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 mb-20"
            >
              <div className="w-12 h-12 bg-white border border-[#dadce0] rounded-2xl flex items-center justify-center shadow-sm">
                <Zap className="text-accent" size={28} fill="currentColor" />
              </div>
              <h1 className="text-4xl font-light tracking-tight text-[#202124]">EdgeElevate <span className="text-[#5f6368] font-thin">/ displacement engine</span></h1>
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
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#1a73e8]/20 to-[#4285f4]/20 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                    <div className="relative bg-white border border-[#dadce0] rounded-2xl flex items-center p-3 shadow-xl focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all">
                      <div className="flex-1 px-4 flex items-center gap-4">
                        <Search className="text-[#80868b]" size={20} />
                        <input 
                          type="text" 
                          placeholder="TARGET STARTUP OR BRAND"
                          value={startupName}
                          onChange={(e) => setStartupName(e.target.value.toUpperCase())}
                          className="bg-transparent border-none outline-none text-[#202124] w-full font-mono text-sm uppercase tracking-widest placeholder:text-[#bdc1c6]"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={!startupName}
                        className="bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shrink-0 flex items-center gap-2"
                      >
                        RUN_SOLVER <ArrowRight size={14} />
                      </button>
                    </div>
                 </div>

                 {/* Indicators */}
                 <div className="flex justify-between items-center px-4">
                    <div className="flex gap-6">
                       <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34a853] animate-pulse"></span>
                          <span className="text-[10px] text-[#5f6368] font-mono uppercase tracking-widest">Engine Online</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]"></span>
                          <span className="text-[10px] text-[#5f6368] font-mono uppercase tracking-widest">Tracing v2.0 Active</span>
                       </div>
                    </div>
                    <div className="text-[10px] text-[#bdc1c6] font-mono uppercase tracking-widest px-2 py-0.5 border border-[#dadce0] rounded">BETA_RELEASE</div>
                 </div>
               </form>
            </motion.div>

            {/* Example links */}
            <div className="mt-32 space-y-6 text-center">
              <p className="text-[10px] text-[#9aa0a6] font-mono uppercase tracking-[0.4em]">Quick Analysis Nodes</p>
              <div className="flex flex-wrap justify-center gap-8">
                {['NOTHING', 'ATTIO', 'BYD', 'LINEAR', 'FIGMA', 'STRIPE'].map((name) => (
                  <button 
                    key={name}
                    onClick={() => setStartupName(name)} 
                    className="text-[11px] font-mono text-[#5f6368] hover:text-[#1a73e8] transition-colors uppercase tracking-[0.2em] border-b border-transparent hover:border-[#1a73e8] pb-1"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Footer */}
            <div className="absolute bottom-12 flex gap-12 text-[10px] text-[#bdc1c6] font-mono uppercase tracking-[0.5em]">
              <span className="hover:text-[#5f6368] cursor-default transition-colors">G2_FEDERATED</span>
              <span className="hover:text-[#5f6368] cursor-default transition-colors">SCRAPE_NODES_LIVE</span>
              <span className="hover:text-[#5f6368] cursor-default transition-colors">Q_CONTEXT_V4</span>
            </div>
          </motion.div>

        )}

        {status === 'analyzing' && (
          <motion.div 
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center bg-black p-6"
          >
            <AnalysisFlow currentStep={currentStep} error={error} />
          </motion.div>
        )}

        {status === 'complete' && resultData && (
          <motion.div 
            key="complete"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen bg-black"
          >
            <Dashboard data={resultData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
