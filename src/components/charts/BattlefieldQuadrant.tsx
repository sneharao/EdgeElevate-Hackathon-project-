import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Shield, Zap, TrendingUp, Info, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CompetitiveDisplacementScore } from '../../types/edgeElevate';

interface BattlefieldQuadrantProps {
  data: CompetitiveDisplacementScore[];
}

export function BattlefieldQuadrant({ data }: BattlefieldQuadrantProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const points = useMemo(() => {
    if (data.length === 0) return [];
    
    const visGaps = data.map(d => d.visibility_gap);
    const minVis = Math.min(...visGaps);
    const maxVis = Math.max(...visGaps);
    const visRange = maxVis - minVis || 0.1;

    const sentDeltas = data.map(d => d.sentiment_delta);
    const minSent = Math.min(...sentDeltas);
    const maxSent = Math.max(...sentDeltas);
    const sentRange = maxSent - minSent || 5;
    
    return data.map((comp) => {
      // Standard Cartesian: 0,0 is bottom-left
      const x = ((comp.visibility_gap - minVis) / visRange) * 75 + 10;
      const y = 90 - (((comp.sentiment_delta - minSent) / sentRange) * 75);

      return {
        ...comp,
        x,
        y,
        id: comp.competitor_id || comp.competitor_name,
      };
    });
  }, [data]);

  const activePoint = points.find(p => p.id === hoveredNode);

  return (
    <div className="relative w-full h-full min-h-[420px] flex flex-col pt-2">
      {/* Top Legend - Fixed Typography */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
            <span className="text-xs text-[var(--ink-muted)] font-bold uppercase tracking-widest">High Opportunity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            <span className="text-xs text-[var(--ink-muted)] font-bold uppercase tracking-widest">Med Opportunity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <span className="text-xs text-[var(--ink-muted)] font-bold uppercase tracking-widest">Low Opportunity</span>
          </div>
        </div>
        <div className="text-xs text-[var(--accent-cyan)] font-mono flex items-center gap-1.5 bg-[var(--accent-cyan)]/5 border border-[var(--accent-cyan)]/20 px-2 py-0.5 rounded shadow-sm">
          <Info size={10} /> <span className="uppercase tracking-tight font-black text-[10px]">Hover for Radar Data</span>
        </div>
      </div>

      <div className="relative flex-1 bg-[var(--color-surface-container-low)]/20 rounded-2xl border border-[var(--line)]/10 overflow-hidden mx-1">
        
        {/* PRO MAX BACKGROUND GRADIENTS */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-[0.05]">
          <div className="bg-gradient-to-br from-green-500/10 to-transparent" />
          <div className="bg-gradient-to-bl from-[var(--accent)]/10 to-transparent" />
          <div className="bg-gradient-to-tr from-gray-500/10 to-transparent" />
          <div className="bg-gradient-to-tl from-[var(--accent-cyan)]/10 to-transparent" />
        </div>

        {/* INTERACTIVE PROJECTIONS (Behind Nodes) */}
        <AnimatePresence>
          {activePoint && (
            <>
              {/* X-Projection */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute border-l border-dashed border-white/30 z-0"
                style={{ left: `${activePoint.x}%`, top: `${activePoint.y}%`, bottom: '5%' }}
              />
              {/* Y-Projection */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute border-t border-dashed border-white/30 z-0"
                style={{ left: '5%', right: `${100 - activePoint.x}%`, top: `${activePoint.y}%` }}
              />
              {/* Axis Value Badges */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-[2%] left-[activePoint.x%] -translate-x-1/2 bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded shadow-xl z-50 uppercase"
                style={{ left: `${activePoint.x}%` }}
              >
                {Math.round(activePoint.visibility_gap * 100)}% Gap
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="absolute left-[1%] top-[activePoint.y%] -translate-y-1/2 bg-[var(--accent-cyan)] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xl z-50"
                style={{ top: `${activePoint.y}%` }}
              >
                {activePoint.sentiment_delta > 0 ? '+' : ''}{activePoint.sentiment_delta.toFixed(1)} Edge
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MAIN AXES */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[5%] top-[5%] bottom-[5%] w-[1px] bg-white opacity-30" />
          <div className="absolute bottom-[5%] left-[5%] right-[5%] h-[1px] bg-white opacity-30" />
          
          {/* AXIS LABELS */}
          <div className="absolute bottom-6 right-10 flex items-center gap-1 text-white/60 z-20">
            <span className="text-xs font-black uppercase tracking-[0.2em]">Visibility Gap →</span>
          </div>
          <div className="absolute left-2 top-10 flex flex-col items-center gap-1 text-white/60 z-20">
            <ChevronUp size={12} className="text-[var(--color-success)]" />
            <span className="text-xs font-black uppercase tracking-[0.2em] vertical-text py-2">Sentiment Advantage</span>
          </div>
        </div>

        {/* QUADRANT LABELS */}
        <div className="absolute top-10 right-10 flex flex-col items-end opacity-40 z-10 pointer-events-none">
          <div className="flex items-center gap-2 text-[var(--accent)] drop-shadow-sm">
            <span className="text-xs font-black uppercase tracking-[0.2em]">Vulnerable Giants</span>
            <Target size={14} />
          </div>
        </div>
        <div className="absolute top-10 left-16 flex flex-col items-start opacity-40 z-10 pointer-events-none">
          <div className="flex items-center gap-2 text-[var(--color-success)] drop-shadow-sm">
            <Zap size={14} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Niche Leaders</span>
          </div>
        </div>

        {/* NODES LAYER */}
        <div className="absolute inset-0 z-30">
          {points.map((point, i) => {
            const left = `${point.x}%`;
            const top = `${point.y}%`;
            const baseSize = 44;
            const size = baseSize + (point.displacement_score * 90);
            const isHigh = point.priority === 'HIGH';
            const isMed = point.priority === 'MEDIUM';
            const showTooltipAbove = point.y > 50; 
            const showTooltipOnLeft = point.x > 75;

            return (
              <motion.div
                key={point.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 100 }}
                style={{ left, top }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                onMouseEnter={() => setHoveredNode(point.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Priority Glow */}
                {(isHigh || isMed) && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className={cn("absolute inset-0 rounded-full blur-2xl", isHigh ? "bg-[var(--accent)]" : "bg-orange-500")}
                    style={{ width: size, height: size }}
                  />
                )}

                {/* Bubble with Sentiment Ring */}
                <div
                  className={cn(
                    "relative rounded-full flex items-center justify-center border-2 shadow-2xl transition-all duration-500 backdrop-blur-[2px]",
                    isHigh ? "bg-[var(--accent)]/20 border-[var(--accent)]" : isMed ? "bg-orange-500/20 border-orange-500" : "bg-white/5 border-white/20",
                    hoveredNode === point.id && "scale-110 z-50 border-white shadow-[0_0_30px_white/30] bg-white/10 backdrop-blur-xl"
                  )}
                  style={{ width: size, height: size }}
                >
                  {/* Internal Sentiment Indicator (Small dot) */}
                  <div className={cn(
                    "absolute top-1 right-1 w-2 h-2 rounded-full border border-black/50 shadow-sm",
                    (!isHigh && !isMed) ? "bg-white/40" : (point.sentiment_delta > 0 ? "bg-emerald-400" : "bg-red-500")
                  )} />

                  <span className="text-xs font-black text-center px-2 truncate uppercase pointer-events-none">
                    {point.competitor_name.split(' ')[0]}
                  </span>

                  {/* TOOLTIP */}
                  <AnimatePresence>
                    {hoveredNode === point.id && (
                      <motion.div
                        initial={{ opacity: 0, y: showTooltipAbove ? 20 : -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: showTooltipAbove ? 20 : -20, scale: 0.9 }}
                        className={cn(
                          "absolute w-56 surface-2 border border-white/20 rounded-2xl p-4 shadow-2xl pointer-events-none z-[100] backdrop-blur-3xl",
                          showTooltipAbove ? "bottom-full mb-4" : "top-full mt-4",
                          showTooltipOnLeft ? "right-0" : "left-0"
                        )}
                      >
                        <div className="text-[12px] font-black text-white mb-3 flex items-center justify-between">
                          <span className="truncate mr-2">{point.competitor_name}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase",
                            isHigh ? "bg-[var(--accent)] text-white" : isMed ? "bg-orange-500 text-white" : "bg-white/20 text-white"
                          )}>
                            {point.priority}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-white/50 uppercase tracking-tighter">Strategic Opportunity</span>
                            <span className="text-[var(--accent-cyan)] font-mono">{Math.round(point.displacement_score * 100)}%</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sentiment Edge</span>
                            <span className={cn(
                              "text-xs font-black font-mono px-2 py-0.5 rounded",
                              point.sentiment_delta > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-[var(--accent)] bg-[var(--accent)]/10"
                            )}>
                              {point.sentiment_delta > 0 ? '+' : ''}{point.sentiment_delta.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Formula Explanation */}
      <div className="mt-4 px-2 py-3 bg-[var(--color-surface-container-low)]/40 rounded-xl border border-[var(--line)]/5">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp size={12} className="text-[var(--accent)]" />
          <span className="text-xs font-black text-[var(--ink)] uppercase tracking-[0.2em]">Competitive Index Formula</span>
        </div>
        <p className="text-[10px] font-mono text-[var(--ink-muted)] leading-relaxed uppercase tracking-wider">
          Score = [(Visibility Gap × 0.45) + (Sentiment Advantage × 0.35) + (Brand Contextual Relevance × 0.20)]
        </p>
      </div>
      
      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
      `}</style>
    </div>
  );
}
