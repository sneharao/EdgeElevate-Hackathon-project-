import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  CheckCircle2,
  Shield,
  Database,
  Cpu,
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

// Pipeline stages that map to backend graph topology
// The backend has parallel nodes that we group into logical stages
const PIPELINE_STAGES = [
  {
    id: 'resolve_project',
    label: 'Identifying Brand',
    activeLabel: 'Identifying your brand context...',
    icon: Search,
    // Maps to: resolve_project node
  },
  {
    id: 'fetch_brand_intelligence',
    label: 'Gathering Intel',
    activeLabel: 'Fetching competitor data & AI prompts...',
    icon: Database,
    isParallel: true,
    parallelHint: '3 parallel streams',
    // Maps to: fetch_brand_intelligence, fetch_source_intelligence, fetch_actions (parallel)
  },
  {
    id: 'compute_displacement_scores',
    label: 'Analyzing Gaps',
    activeLabel: 'Computing displacement scores...',
    icon: Cpu,
    isParallel: true,
    parallelHint: '3 parallel analyses',
    // Maps to: compute_displacement_scores, analyze_narrative, map_source_gaps (parallel)
  },
  {
    id: 'generate_linkedin_posts',
    label: 'Generating Content',
    activeLabel: 'Crafting content & strategy...',
    icon: Sparkles,
    isParallel: true,
    parallelHint: '4 outputs',
    // Maps to: generate_content_opportunities, generate_positioning, generate_linkedin_posts, generate_video_script
  },
];

// Edge component for connecting nodes
function PipelineEdge({
  isActive,
  isCompleted,
  isParallel,
}: {
  isActive: boolean;
  isCompleted: boolean;
  isParallel?: boolean;
}) {
  return (
    <div className="relative flex-1 min-w-[60px] max-w-[100px] h-[2px] mx-4">
      {/* Background track */}
      <div className="absolute inset-0 bg-[var(--line)] opacity-30 rounded-full" />

      {/* Completed state */}
      {isCompleted && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-cyan)] rounded-full origin-left"
        />
      )}

      {/* Active state - animated flow */}
      {isActive && (
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
          />
        </div>
      )}

      {/* Parallel branch indicator */}
      {isParallel && (isActive || isCompleted) && (
        <>
          <div className={cn(
            "absolute top-[-6px] left-1/2 -translate-x-1/2 w-[2px] h-[6px] rounded-full transition-colors duration-300",
            isCompleted ? "bg-[var(--accent)]" : "bg-[var(--accent)] opacity-60"
          )} />
          <div className={cn(
            "absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-[2px] h-[6px] rounded-full transition-colors duration-300",
            isCompleted ? "bg-[var(--accent)]" : "bg-[var(--accent)] opacity-60"
          )} />
        </>
      )}
    </div>
  );
}

// Node component
function PipelineNode({
  stage,
  status,
  index,
}: {
  stage: typeof PIPELINE_STAGES[0];
  status: 'pending' | 'active' | 'completed';
  index: number;
}) {
  const Icon = stage.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="flex flex-col items-center gap-4 min-w-[140px]"
    >
      {/* Node circle */}
      <div className="relative">
        {/* Glow effect for active */}
        {status === 'active' && (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-[-8px] rounded-full bg-[var(--accent)]"
          />
        )}

        {/* Main node */}
        <div className={cn(
          "relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
          status === 'active' && "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-cyan)] shadow-lg",
          status === 'completed' && "bg-[var(--color-surface-container-high)] border border-[var(--accent)]/40",
          status === 'pending' && "bg-[var(--color-surface-container)] border border-[var(--line)] opacity-40"
        )}>
          {status === 'completed' ? (
            <CheckCircle2
              size={22}
              className="text-[var(--color-success)]"
            />
          ) : (
            <Icon
              size={22}
              className={cn(
                status === 'active' && "text-[var(--color-on-primary)]",
                status === 'pending' && "text-[var(--ink-muted)]"
              )}
            />
          )}
        </div>

        {/* Parallel indicator dots */}
        {stage.isParallel && status === 'active' && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-1 h-1 rounded-full bg-[var(--accent-cyan)]"
              />
            ))}
          </div>
        )}
      </div>

      {/* Label */}
      <div className="text-center px-2">
        <p className={cn(
          "text-sm font-semibold tracking-wide transition-colors duration-300 leading-tight mb-1",
          status === 'active' && "text-[var(--ink)]",
          status === 'completed' && "text-[var(--ink-muted)]",
          status === 'pending' && "text-[var(--ink-muted)] opacity-40"
        )}>
          {stage.label}
        </p>

        {/* Active description */}
        {status === 'active' && stage.isParallel && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-[var(--accent)] font-mono uppercase tracking-wider"
          >
            {stage.parallelHint}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

export function AnalysisFlow({
  currentStep,
  error
}: {
  currentStep: string;
  error?: string | null;
}) {
  // Calculate the status of each stage
  const stageStatuses = useMemo(() => {
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStep);
    const isComplete = currentStep === 'complete';

    return PIPELINE_STAGES.map((stage, idx) => {
      if (isComplete) return 'completed';
      if (idx < currentIndex) return 'completed';
      if (idx === currentIndex) return 'active';
      return 'pending';
    });
  }, [currentStep]);

  const activeStage = PIPELINE_STAGES.find(s => s.id === currentStep);

  return (
    <div className="w-full max-w-5xl mx-auto px-8 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 surface-1 rounded-full mb-4">
          <Zap size={12} className="text-[var(--accent)]" />
          <span className="text-[10px] font-mono text-[var(--ink-muted)] uppercase tracking-[0.2em]">
            Pipeline Active
          </span>
        </div>
        <h2 className="text-2xl font-light tracking-tight text-[var(--ink)] mb-2">
          EdgeElevate<span className="text-[var(--accent)] italic font-medium">X</span>
        </h2>

        {/* Active stage description */}
        {activeStage && (
          <motion.p
            key={activeStage.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base md:text-lg text-[var(--ink)] font-medium mt-6 max-w-2xl mx-auto leading-relaxed text-center"
          >
            {activeStage.activeLabel}
          </motion.p>
        )}
      </motion.div>

      {/* Horizontal Pipeline */}
      <div className="relative">
        {/* Pipeline container */}
        <div className="flex items-center justify-center">
          {PIPELINE_STAGES.map((stage, idx) => {
            const nextStage = PIPELINE_STAGES[idx + 1];
            return (
              <React.Fragment key={stage.id}>
                <PipelineNode
                  stage={stage}
                  status={stageStatuses[idx] as 'pending' | 'active' | 'completed'}
                  index={idx}
                />

                {/* Edge between nodes (except after last) */}
                {idx < PIPELINE_STAGES.length - 1 && (
                  <PipelineEdge
                    isActive={stageStatuses[idx] === 'active'}
                    isCompleted={stageStatuses[idx] === 'completed'}
                    isParallel={nextStage?.isParallel}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Overall progress bar */}
        <div className="mt-20 mx-auto max-w-xl">
          <div className="h-1.5 bg-[var(--color-surface-container)] rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-cyan)] rounded-full shadow-[0_0_10px_rgba(173,198,255,0.5)]"
              initial={{ width: '0%' }}
              animate={{
                width: currentStep === 'complete'
                  ? '100%'
                  : `${((stageStatuses.filter(s => s === 'completed').length + 0.5) / PIPELINE_STAGES.length) * 100}%`
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex flex-col items-center mt-6 gap-2">
            <p className="text-sm md:text-base text-[var(--ink)] font-mono font-bold uppercase tracking-[0.3em] text-center whitespace-nowrap">
              {currentStep === 'complete'
                ? 'Analysis Complete'
                : `Stage ${stageStatuses.filter(s => s !== 'pending').length} of ${PIPELINE_STAGES.length}`
              }
            </p>
            <div className="flex gap-1.5">
              {PIPELINE_STAGES.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-12 h-1 rounded-full transition-all duration-500",
                    stageStatuses[i] === 'completed' ? "bg-[var(--accent)]" : 
                    stageStatuses[i] === 'active' ? "bg-[var(--accent-cyan)] w-16" : "bg-[var(--line)] opacity-30"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-container p-4 mt-12 max-w-md mx-auto"
        >
          <p className="error-text text-[10px] font-mono flex items-center justify-center gap-2 uppercase tracking-tight">
            <Shield size={12} /> Pipeline Error: {error}
          </p>
        </motion.div>
      )}
    </div>
  );
}
