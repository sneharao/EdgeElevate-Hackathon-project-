import React from 'react';
import { motion } from 'motion/react';
import { Search, CheckCircle2, Shield, Zap, TrendingUp, Send } from 'lucide-react';
import { cn } from '../lib/utils';

const steps = [
  { id: 'research', label: 'Scraping G2 & Market Intelligence', icon: Search },
  { id: 'sentiment', label: 'Running Sentiment Decomposition', icon: TrendingUp },
  { id: 'insights', label: 'Synthesizing Displacement Vectors', icon: Zap },
  { id: 'content', label: 'Generating Strategic Narratives', icon: Send },
];

export function AnalysisFlow({ currentStep, error }: { currentStep: string, error?: string | null }) {
  return (
    <div className="space-y-6 max-w-sm mx-auto py-12">
      <div className="text-center mb-10">
        <div className="inline-block px-3 py-1 surface-1 rounded-full mb-4">
          <span className="text-[10px] font-mono text-[var(--ink-muted)] uppercase tracking-[0.2em]">Engine Orchestration</span>
        </div>
        <h2 className="text-3xl font-light tracking-tight text-[var(--ink)]">
          EdgeElevate<span className="text-[var(--accent)] italic font-medium">X</span>
        </h2>
        <p className="text-[var(--ink-muted)] text-[10px] uppercase tracking-widest mt-2">Distributed Analysis Node Active</p>
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
                "analysis-step flex items-center gap-4 p-4 rounded-lg",
                isActive && "analysis-step-active",
                isCompleted && !isActive && "analysis-step-completed",
                !isActive && !isCompleted && "analysis-step-pending"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-all",
                isActive && "analysis-step-icon-active",
                isCompleted && !isActive && "analysis-step-icon-completed",
                !isActive && !isCompleted && "analysis-step-icon-pending"
              )}>
                <step.icon size={16} />
              </div>

              <div className="flex-1">
                <p className={cn(
                  "text-[12px] tracking-wide font-medium",
                  isActive ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"
                )}>{step.label}</p>
                {isActive && (
                  <div className="progress-bar-animated mt-2" />
                )}
              </div>

              {isActive && (
                <div className="relative flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping absolute opacity-40"></div>
                  <div className="status-dot status-dot-primary"></div>
                </div>
              )}
              {isCompleted && !isActive && <CheckCircle2 className="text-[var(--color-success)]" size={14} />}
            </motion.div>
          );
        })}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-container p-4 mt-8"
        >
          <p className="error-text text-[10px] font-mono flex items-center gap-2 uppercase tracking-tight">
            <Shield size={12} /> Execution error: {error}
          </p>
        </motion.div>
      )}
    </div>
  );
}
