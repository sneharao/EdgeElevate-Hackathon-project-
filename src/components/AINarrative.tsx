import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, Ghost, Shield, Zap, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { NarrativeAnalysis } from "../types/edgeElevate";

interface AINarrativeProps {
  data: NarrativeAnalysis;
  brandName: string;
}

export function AINarrative({ data, brandName }: AINarrativeProps) {
  const { own_brand_framing, competitor_framings, strategic_reframe } = data;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className="flex flex-col gap-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Brand Narrative Section */}
      <div className="glass-panel rounded-xl p-6 border-t-2 border-[var(--accent)]/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Target size={80} className="text-[var(--accent)]" />
        </div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
            <Zap size={20} className="text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-[var(--ink)]">
              AI Brand Narrative Analysis
            </h2>
            <p className="text-xs text-[var(--ink-muted)] font-mono">
              TARGET_BRAND: {brandName.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {/* Positive Patterns */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--accent-cyan)] mb-2">
              <CheckCircle2 size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Positive Patterns</span>
            </div>
            <ul className="space-y-2">
              {own_brand_framing.positive_patterns.map((p, i) => (
                <motion.li key={i} variants={itemVariants} className="text-sm text-[var(--ink-dim)] leading-relaxed pl-4 border-l border-[var(--accent-cyan)]/20 italic">
                  "{p}"
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Negative Patterns */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <AlertCircle size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Negative Patterns</span>
            </div>
            <ul className="space-y-2">
              {own_brand_framing.negative_patterns.map((p, i) => (
                <motion.li key={i} variants={itemVariants} className="text-sm text-[var(--ink-dim)] leading-relaxed pl-4 border-l border-rose-500/20 italic">
                  "{p}"
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Factual Stuff */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Info size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Factual Stuff</span>
            </div>
            <ul className="space-y-2">
              {own_brand_framing.neutral_descriptors.map((p, i) => (
                <motion.li key={i} variants={itemVariants} className="text-sm text-[var(--ink-dim)] leading-relaxed pl-4 border-l border-blue-500/20">
                  {p}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Missing Narratives */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Ghost size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">AI Narrative Gaps</span>
            </div>
            <ul className="space-y-2">
              {own_brand_framing.missing_narratives.map((p, i) => (
                <motion.li key={i} variants={itemVariants} className="text-sm text-[var(--ink-dim)] leading-relaxed pl-4 border-l border-amber-500/20 italic">
                  "{p}"
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Strategic Reframe */}
        <div className="mt-8 p-5 surface-1 rounded-xl border-l-4 border-[var(--accent)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent relative z-10">
          <label className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.2em] mb-2 block">
            The Shift in Brand's Market Position
          </label>
          <div className="prose prose-invert max-w-none text-xs text-[var(--ink)] leading-relaxed italic opacity-90">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="text-[var(--accent)] font-bold">{children}</strong>,
              }}
            >
              {strategic_reframe}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Competitor Analysis Table */}
      <div className="glass-panel rounded-xl p-6 border-t-2 border-[var(--accent-cyan)]/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[var(--accent-cyan)]/10 rounded-lg">
            <Shield size={20} className="text-[var(--accent-cyan)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-[var(--ink)]">
              Competitor Strategic Analysis
            </h2>
            <p className="text-[10px] text-[var(--ink-muted)] font-mono">
              VULNERABILITY_MAPPING_ENGINE
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)]/10 text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                <th className="py-3 px-4 font-bold">Competitor</th>
                <th className="py-3 px-4 font-bold">Key Advantages</th>
                <th className="py-3 px-4 font-bold">Vulnerabilities</th>
                <th className="py-3 px-4 font-bold">Challengeable Claims</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {competitor_framings.map((comp, i) => (
                <motion.tr 
                  key={i} 
                  variants={itemVariants}
                  className="border-b border-[var(--line)]/5 hover:bg-[var(--accent)]/5 transition-colors group"
                >
                  <td className="py-4 px-4 align-top">
                    <span className="font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                      {comp.name}
                    </span>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <ul className="space-y-1">
                      {comp.key_advantages_cited.map((item, j) => (
                        <li key={j} className="text-[var(--ink-dim)]">• {item}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <ul className="space-y-1">
                      {comp.vulnerabilities.map((item, j) => (
                        <li key={j} className="text-rose-400/80 italic">• {item}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <ul className="space-y-1">
                      {comp.counter_narrative_opportunities.map((item, j) => (
                        <li key={j} className="text-[var(--accent-cyan)] font-medium">• {item}</li>
                      ))}
                    </ul>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
