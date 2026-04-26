import React from "react";
import { Linkedin, Zap, Play, Video } from "lucide-react";
import { SentimentChart, KeywordFrequency } from "./Charts";
import { BattlefieldQuadrant } from "./charts/BattlefieldQuadrant";
import { SourceGapList } from "./charts/SourceGapList";
import { ShareOfVoicePie } from "./charts/ShareOfVoicePie";
import { OpportunityTreemap } from "./charts/OpportunityTreemap";
import { VisibilityBars } from "./charts/VisibilityBars";
import { AINarrative } from "./AINarrative";
import type { EdgeElevateResponse } from "../types/edgeElevate";

export function Dashboard({ data }: { data: EdgeElevateResponse }) {
  const [expandedPost, setExpandedPost] = React.useState<number | null>(null);
  const {
    startup_name,
    brand_report = [],
    own_brand = { id: "", name: "" },
    competitor_brands = [],
    competitive_displacement_scores = [],
    source_gap_map = {
      missing_high_authority: [],
      present_low_impact: [],
      competitive_battlegrounds: [],
      untapped_channels: [],
    },
    content_opportunities = [],
    narrative_analysis,
    positioning_statement,
    linkedin_posts = [],
    video_script,
  } = data;

  return (
    <div className="w-full min-h-screen landing-bg text-[var(--ink)] font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="dashboard-header flex items-center justify-between px-8 shrink-0 z-10 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-cyan)] rounded-xl flex items-center justify-center shadow-lg glow-primary">
            <Zap
              className="text-[var(--color-on-primary)]"
              size={18}
              fill="currentColor"
            />
          </div>
          <div>
            <h1 className="text-xl font-light tracking-tight text-[var(--ink)]">
              EdgeElevate{" "}
              <span className="text-[var(--ink-muted)] font-thin">
                / Engine Orchestration
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-6 text-[10px] uppercase font-mono tracking-widest">
          <div className="flex items-center gap-2 px-3 py-1 surface-1 rounded-full">
            <span className="status-dot status-dot-primary status-dot-pulse"></span>
            <span className="text-[var(--ink-muted)]">
              Displacement Solver Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="flex-1 grid grid-cols-12 gap-5 p-6 overflow-hidden">
        {/* Left Column: Context & Opps (3 cols) */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-5 overflow-y-auto pr-2">
          <div className="glass-panel rounded-lg p-5">
            <label className="label-md text-[var(--ink-muted)] mb-3 block text-[10px] uppercase tracking-widest">
              Analyzed Target Identity
            </label>
            <div className="text-2xl font-light text-[var(--ink)] mb-3">
              {startup_name}
            </div>
            <p className="quote-block text-sm text-[var(--ink-dim)] leading-relaxed italic border-l-2 border-[var(--accent)] pl-4">
              "{positioning_statement || `Analyzing competitive landscape for ${startup_name}`}"
            </p>
          </div>

          <div className="glass-panel rounded-lg p-5">
            <label className="label-md text-[var(--ink-muted)] mb-4 block text-[10px] uppercase tracking-widest">
              Content Opportunities
            </label>
            <div className="space-y-3">
              {content_opportunities?.slice(0, 3).map((opp, i) => (
                <div
                  key={i}
                  className="p-3 surface-1 rounded-lg border-l-2 border-[var(--accent-cyan)]/40"
                >
                  <p className="text-xs font-medium text-[var(--ink)] mb-1">{opp.title}</p>
                  <p className="text-[10px] text-[var(--ink-dim)] line-clamp-2">{opp.topic}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sources to Focus On - Moved here */}
          <div className="glass-panel rounded-lg p-5 flex flex-col flex-1 min-h-[300px]">
            <label className="label-md text-[var(--ink-muted)] mb-3 block text-[10px] uppercase tracking-widest">
              Sources to Focus On
            </label>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <SourceGapList
                data={source_gap_map?.missing_high_authority || []}
              />
            </div>
          </div>
        </section>

        {/* Right Section: Strategic View & Details (9 cols) */}
        <section className="col-span-12 lg:col-span-9 flex flex-col gap-5 overflow-y-auto pr-2">
          {/* Top: Wide Battlefield Quadrant */}
          <div className="glass-panel rounded-lg p-5 h-[480px] flex flex-col shrink-0">
            <div className="flex justify-between items-center mb-4">
              <label className="label-md text-[var(--ink-muted)] block uppercase tracking-widest text-[10px]">
                Market Battlefield Quadrant
              </label>
              <div className="tag-primary text-[10px] font-mono px-2 py-0.5 rounded shadow-sm glow-primary">
                STRATEGIC_MAPPING
              </div>
            </div>
            <div className="flex-1 relative">
              {competitive_displacement_scores.length > 0 ? (
                <BattlefieldQuadrant data={competitive_displacement_scores} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[var(--ink-dim)] italic">
                  Insufficient data for strategic mapping
                </div>
              )}
            </div>
          </div>

          {/* AI Narrative Section */}
          {narrative_analysis && (
            <AINarrative data={narrative_analysis} brandName={startup_name} />
          )}

          {/* Bottom Grid: Social and Video (Balanced) */}
          <div className="grid grid-cols-12 gap-5 h-[400px] shrink-0">
            {/* HERA Video Engine */}
            <div className="col-span-6 glass-panel rounded-lg p-5 flex flex-col">
              <label className="label-md text-[var(--ink-muted)] mb-3 block text-[10px] uppercase tracking-widest">
                HERA Visual Narrative
              </label>
              <div className="video-placeholder aspect-video rounded-lg overflow-hidden relative group cursor-pointer mb-3 shrink-0">
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent)]/5 group-hover:bg-[var(--accent)]/10 transition-colors">
                  <div className="video-play-button flex items-center justify-center pl-1 shadow-lg group-hover:scale-110 transition-all glow-primary">
                    <Zap className="text-[var(--accent)]" size={24} />
                  </div>
                </div>
              </div>
              <div className="surface-1 rounded-lg p-3 overflow-y-auto flex-1 mb-3">
                {video_script && !("parse_error" in video_script) ? (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-[var(--ink)]">{video_script.title}</h3>
                    <p className="text-[10px] text-[var(--ink-dim)]">{video_script.description}</p>
                  </div>
                ) : (
                  <div className="text-[10px] text-[var(--ink-dim)] italic">Synthesizing narrative flow...</div>
                )}
              </div>
              <button className="btn-primary py-2 rounded-lg text-xs w-full flex items-center justify-center gap-2">
                <Video size={14} />
                Generate Video
              </button>
            </div>

            {/* Social Feed */}
            <div className="col-span-6 glass-panel rounded-lg p-5 flex flex-col overflow-hidden">
              <label className="label-md text-[var(--ink-muted)] mb-3 block text-[10px] uppercase tracking-widest">
                Social Feed Ideas
              </label>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {linkedin_posts.map((post, i) => {
                  const isExpanded = expandedPost === i;
                  return (
                    <div 
                      key={i} 
                      className={`social-post-card p-3 surface-1 rounded-lg border transition-all duration-300 cursor-pointer relative group ${
                        isExpanded ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5 shadow-lg' : 'border-[var(--line)]/10 hover:border-[var(--line)]/30'
                      }`}
                      onClick={() => setExpandedPost(isExpanded ? null : i)}
                    >
                      <div className="absolute top-3 right-3 p-1 rounded bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
                        <Linkedin size={10} />
                      </div>
                      <div className="flex justify-between items-center mb-2 pr-6">
                        <span className="text-[9px] font-mono text-[var(--accent)]">NODE_{i + 1}</span>
                      </div>
                      <p className="text-[11px] font-bold text-[var(--ink)] mb-2">{post.hook}</p>
                      <p className={`text-[10px] text-[var(--ink-dim)] leading-relaxed transition-all duration-300 ${
                        isExpanded ? '' : 'line-clamp-3'
                      }`}>
                        {post.body}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1">
                          {isExpanded ? 'Show less' : 'Read more'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Status Bar */}
      <footer className="dashboard-footer flex items-center px-8 text-[10px] text-[var(--ink-muted)] justify-between font-mono tracking-widest shrink-0 z-10">
        <div className="flex gap-8">
          <span className="flex items-center gap-2">
            <div className="status-dot status-dot-primary" /> ENGINE_VER: EDGE_ELEVATE_X_2.4
          </span>
        </div>
        <div className="flex gap-8 uppercase">
          <span className="text-[var(--line)]">BETA_INTERNAL_SCRAPE</span>
          <span className="flex items-center gap-2 text-[var(--ink)]">
            <div className="status-dot status-dot-primary status-dot-pulse" /> SOLVER_ONLINE
          </span>
        </div>
      </footer>
    </div>
  );
}
