import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, CheckCircle2, Shield, Zap, TrendingUp, Send } from 'lucide-react';
import { cn } from '../lib/utils';

const steps = [
  { id: 'research', label: 'Competitor Analysis (Peec AI)', icon: Search },
  { id: 'sentiment', label: 'Sentiment Scraping (Trustpilot/G2)', icon: TrendingUp },
  { id: 'insights', label: 'Insight Structuring (Q-Context)', icon: Zap },
  { id: 'content', label: 'HERA Content Generation', icon: Shield },
];

export function AnalysisFlow({ currentStep, error }: { currentStep: string, error?: string | null }) {
  return (
    <div className="space-y-6 max-w-sm mx-auto py-12">
      <div className="text-center mb-10">
        <div className="inline-block px-3 py-1 border border-[#dadce0] rounded-full bg-[#f1f3f4] mb-4">
          <span className="text-[10px] font-mono text-[#5f6368] uppercase tracking-[0.2em]">Engine Orchestration</span>
        </div>
        <h2 className="text-3xl font-light tracking-tight text-[#202124]">EdgeElevate<span className="text-accent italic font-medium">X</span></h2>
        <p className="text-[#80868b] text-[10px] uppercase tracking-widest mt-2">Distributed Analysis Node Active</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isCompleted = steps.findIndex(s => s.id === currentStep) > idx || currentStep === 'complete';
          const isActive = step.id === currentStep;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4 transition-all duration-500 border rounded-xl",
                isActive ? "bg-white border-[#dadce0] shadow-md" : 
                isCompleted ? "opacity-60 bg-[#f8f9fa] border-transparent" : "opacity-30 border-transparent"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg border",
                isActive ? "text-accent border-[#1a73e8]/20 bg-[#1a73e8]/5" : 
                isCompleted ? "text-[#5f6368] border-[#dadce0] bg-white" : "text-zinc-300 border-zinc-100"
              )}>
                <step.icon size={16} />
              </div>
              
              <div className="flex-1">
                <p className={cn(
                  "text-[12px] tracking-wide font-medium",
                  isActive ? "text-[#202124]" : "text-[#5f6368]"
                )}>{step.label}</p>
                {isActive && (
                  <div className="h-[1px] bg-[#f1f3f4] mt-2 relative overflow-hidden rounded-full">
                    <motion.div 
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      className="absolute inset-0 bg-accent w-1/3"
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                )}
              </div>

              {isActive && (
                <div className="relative flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-accent animate-ping absolute opacity-40"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                </div>
              )}
              {isCompleted && <CheckCircle2 className="text-[#34a853]" size={14} />}
            </motion.div>
          );
        })}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 rounded-xl mt-8"
        >
          <p className="text-red-600 text-[10px] font-mono flex items-center gap-2 uppercase tracking-tight">
            <Shield size={12} /> Execution error: {error}
          </p>
        </motion.div>
      )}
    </div>
  );
}
