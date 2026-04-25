import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Linkedin, Zap } from 'lucide-react';
import {
  SentimentChart,
  FeatureMatrix,
  KeywordFrequency
} from './Charts';

export function Dashboard({ data }: { data: any }) {
  const { research, sentiment, insights, content, startupName } = data;

  return (
    <div className="w-full min-h-screen landing-bg text-[var(--ink)] font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="dashboard-header flex items-center justify-between px-8 shrink-0 z-10 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-cyan)] rounded-xl flex items-center justify-center shadow-lg glow-primary">
            <Zap className="text-[var(--color-on-primary)]" size={18} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-light tracking-tight text-[var(--ink)]">
              EdgeElevate <span className="text-[var(--ink-muted)] font-thin">/ Engine Orchestration</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-6 text-[10px] uppercase font-mono tracking-widest">
          <div className="flex items-center gap-2 px-3 py-1 surface-1 rounded-full">
            <span className="status-dot status-dot-primary status-dot-pulse"></span>
            <span className="text-[var(--ink-muted)]">Displacement Solver Active</span>
          </div>
          <button className="btn-primary px-6 py-2 rounded-xl normal-case tracking-normal cursor-pointer">
            Download Dossier
          </button>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">

        {/* Column 1: Core Research (3 cols) */}
        <section className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto pr-2">
          <div className="glass-panel rounded-lg p-6">
            <label className="label-md text-[var(--ink-muted)] mb-4 block">Target Identity</label>
            <div className="text-3xl font-light text-[var(--ink)] mb-2">{startupName}</div>
            <div className="tag-primary inline-block px-2 py-0.5 text-[10px] rounded font-mono uppercase mb-4 tracking-tighter">
              {research?.industry || "Market Disruptor"}
            </div>
            <p className="quote-block text-xs text-[var(--ink-dim)] leading-relaxed italic">
              "We've identified critical structural vulnerabilities in {startupName}'s core business model."
            </p>
          </div>

          <div className="glass-panel rounded-lg p-6">
            <label className="label-md text-[var(--ink-muted)] block mb-4">Competitor Topology</label>
            <div className="space-y-4">
              {research?.competitors?.map((c: any, i: number) => (
                <div key={i} className="competitor-item flex justify-between items-center cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="competitor-avatar flex items-center justify-center text-[10px] font-bold text-[var(--ink-muted)]">
                      {c.name[0]}
                    </div>
                    <span className="text-xs font-medium text-[var(--ink)]">{c.name}</span>
                  </div>
                  <div className="competitor-progress">
                    <div className="competitor-progress-fill" style={{ width: `${Math.random() * 60 + 40}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-lg p-6">
            <div className="label-md text-[var(--ink-muted)] mb-6">Sentiment Spectrum</div>
            <div className="h-[200px]">
              <SentimentChart data={sentiment || {}} />
            </div>
            <div className="flex justify-between mt-6 pt-4 border-t border-[var(--line)]/50 text-[10px] text-[var(--ink-muted)] font-mono">
              <span className="uppercase">User Friction</span>
              <span className="text-[var(--color-error)] font-bold">Trend Elevated</span>
            </div>
          </div>
        </section>

        {/* Column 2: Displacement Matrix (5 cols) */}
        <section className="col-span-12 lg:col-span-5 space-y-6 overflow-y-auto pr-2">
          <div className="glass-panel rounded-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <label className="label-md text-[var(--ink-muted)] block">Defensive Gap Analysis</label>
              <div className="tag-primary text-[10px] font-mono px-2 py-0.5 rounded">v2.4_SOLVER</div>
            </div>
            <div className="aspect-[4/3] w-full relative">
              <FeatureMatrix competitors={research?.competitors || []} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-lg p-6 card-accent-primary">
              <div className="label-md text-[var(--ink-muted)] mb-3">Winning Narrative</div>
              <p className="text-sm text-[var(--ink)] leading-relaxed italic">
                "{insights?.differentiationAngle || "Displacing legacy monoliths with modular intelligence."}"
              </p>
            </div>
            <div className="glass-panel rounded-lg p-6 card-accent-success">
              <div className="label-md text-[var(--ink-muted)] mb-3">Growth Vector</div>
              <p className="text-xs text-[var(--ink-dim)] leading-relaxed">
                {insights?.opportunities?.[0] || "Analysis identifies significant overhead reduction through decentralized infrastructure."}
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-lg p-8">
            <label className="label-md text-[var(--ink-muted)] mb-6 block">Target Review Themes (Semantic)</label>
            <div className="h-[280px]">
              <KeywordFrequency themes={sentiment?.topThemes || ['Innovation', 'Scale', 'UX', 'Legacy', 'Support']} />
            </div>
          </div>
        </section>

        {/* Column 3: HERA Content Output (4 cols) */}
        <section className="col-span-12 lg:col-span-4 space-y-6 overflow-y-auto pr-2">
          <div className="glass-panel rounded-lg p-6 overflow-hidden flex flex-col">
            <label className="label-md text-[var(--ink-muted)] mb-6 block">HERA Visual Narrative Engine</label>
            <div className="video-placeholder aspect-video rounded-lg overflow-hidden relative group cursor-pointer mb-6">
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent)]/5 group-hover:bg-[var(--accent)]/10 transition-colors">
                <div className="video-play-button flex items-center justify-center pl-1 shadow-lg group-hover:scale-110 transition-all glow-primary">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-[var(--accent)] border-b-[10px] border-b-transparent"></div>
                </div>
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 surface-1 backdrop-blur rounded-lg">
                <div className="status-dot status-dot-error animate-pulse"></div>
                <div className="text-[10px] text-[var(--ink-muted)] font-mono font-bold">SIM_ACTIVE</div>
              </div>
              <div className="absolute bottom-4 left-4">
                <div className="tag-primary text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase font-mono tracking-widest">CEO_SCRIPT_DRAFTER</div>
              </div>
            </div>
            <div className="flex-1 surface-1 rounded-lg p-4 overflow-y-auto max-h-[300px]">
              <div className="markdown-content">
                <ReactMarkdown>{content?.videoScript || "Synthesizing executive narrative flow..."}</ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-lg p-6 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <label className="label-md text-[var(--ink-muted)] block">Social Displacement Feed</label>
              <Linkedin size={18} className="text-[var(--accent-cyan)]" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {content?.linkedInPosts?.map((post: any, i: number) => (
                <div key={i} className="social-post-card">
                  <div className="text-[10px] font-mono text-[var(--accent)] font-bold uppercase tracking-widest mb-4 flex justify-between items-center">
                    <span>Node_{i + 1}</span>
                    <span className="tag-secondary px-2 py-0.5 rounded uppercase text-[9px] font-normal tracking-normal">
                      {i === 0 ? 'INSIGHT' : 'FOUNDER'} Post
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-dim)] leading-relaxed whitespace-pre-wrap">{post}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Status Bar */}
      <footer className="dashboard-footer flex items-center px-8 text-[10px] text-[var(--ink-muted)] justify-between font-mono tracking-widest shrink-0 z-10">
        <div className="flex gap-8">
          <span className="flex items-center gap-2"><div className="status-dot status-dot-primary" /> ENGINE_VER: EDGE_ELEVATE_X_2.4</span>
          <span className="flex items-center gap-2"><div className="status-dot status-dot-success" /> DATA_SOURCE: G2_FEDERATED</span>
        </div>
        <div className="flex gap-8 uppercase">
          <span className="text-[var(--line)]">BETA_INTERNAL_SCRAPE</span>
          <span className="flex items-center gap-2 text-[var(--ink)]"><div className="status-dot status-dot-primary status-dot-pulse" /> SOLVER_ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
