import React from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Building2, 
  MapPin, 
  Target, 
  AlertCircle, 
  ArrowUpRight, 
  Download,
  Share2,
  Video,
  Linkedin,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  SentimentChart, 
  FeatureMatrix, 
  KeywordFrequency 
} from './Charts';

export function Dashboard({ data }: { data: any }) {
  const { research, sentiment, insights, content, startupName } = data;

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] text-[#3c4043] font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-[#dadce0] flex items-center justify-between px-8 bg-white shrink-0 shadow-sm z-10 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#1a73e8] rounded-xl flex items-center justify-center shadow-md shadow-[#1a73e8]/20">
            <Zap className="text-white" size={18} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-light tracking-tight text-[#202124]">EdgeElevate <span className="text-[#5f6368] font-thin">/ Engine Orchestration</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-6 text-[10px] uppercase font-mono tracking-widest">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#f1f3f4] rounded-full border border-[#dadce0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8] animate-pulse"></span>
            <span className="text-[#5f6368]">Displacement Solver Active</span>
          </div>
          <button className="px-6 py-2 bg-[#1a73e8] text-white font-bold rounded-xl normal-case tracking-normal hover:bg-[#185abc] transition-all shadow-md shadow-[#1a73e8]/20">Download Dossier</button>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* Column 1: Core Research (3 cols) */}
        <section className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto pr-2">
          <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm">
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#80868b] mb-4 block font-bold">Target Identity</label>
            <div className="text-3xl font-light text-[#202124] mb-2">{startupName}</div>
            <div className="inline-block px-2 py-0.5 bg-[#e8f0fe] text-[#1967d2] text-[10px] rounded font-mono uppercase mb-4 uppercase tracking-tighter shadow-sm border border-[#1967d2]/10 mb-4">{research?.industry || "Market Disruptor"}</div>
            <p className="text-xs text-[#5f6368] leading-relaxed italic border-l-2 border-[#1a73e8]/20 pl-4 py-2 bg-[#f8f9fa] rounded-r-lg">
              "We've identified critical structural vulnerabilities in {startupName}'s core business model."
            </p>
          </div>

          <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm">
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#80868b] block font-bold mb-4">Competitor Topology</label>
            <div className="space-y-4">
              {research?.competitors?.map((c: any, i: number) => (
                <div key={i} className="flex justify-between items-center group cursor-default">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#f8f9fa] border border-[#dadce0] flex items-center justify-center text-[10px] font-bold text-[#5f6368] group-hover:border-[#1a73e8] transition-colors">{c.name[0]}</div>
                      <span className="text-xs font-medium text-[#202124]">{c.name}</span>
                   </div>
                   <div className="h-1 w-12 bg-[#f1f3f4] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1a73e8]" style={{ width: `${Math.random() * 60 + 40}%` }} />
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm">
            <div className="text-[10px] text-[#80868b] uppercase tracking-[0.2em] font-bold mb-6">Sentiment Spectrum</div>
            <div className="h-[200px]">
              <SentimentChart data={sentiment || {}} />
            </div>
            <div className="flex justify-between mt-6 pt-4 border-t border-[#f1f3f4] text-[10px] text-[#5f6368] font-mono">
              <span className="uppercase">User Friction</span>
              <span className="text-[#ea4335] font-bold">Trend Elevated</span>
            </div>
          </div>
        </section>

        {/* Column 2: Displacement Matrix (5 cols) */}
        <section className="col-span-12 lg:col-span-5 space-y-6 overflow-y-auto pr-2">
          <div className="bg-white border border-[#dadce0] rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[#80868b] font-bold block">Defensive Gap Analysis</label>
              <div className="text-[10px] text-[#1a73e8] font-mono border border-[#1a73e8]/20 bg-[#e8f0fe] px-2 py-0.5 rounded">v2.4_SOLVER</div>
            </div>
            <div className="aspect-[4/3] w-full relative">
               <FeatureMatrix competitors={research?.competitors || []} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm border-t-4 border-t-[#1a73e8]">
              <div className="text-[10px] text-[#80868b] uppercase font-bold mb-3 tracking-widest">Winning Narrative</div>
              <p className="text-sm text-[#202124] leading-relaxed italic font-serif">
                "{insights?.differentiationAngle || "Displacing legacy monoliths with modular intelligence."}"
              </p>
            </div>
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm border-t-4 border-t-[#34a853]">
              <div className="text-[10px] text-[#80868b] uppercase font-bold mb-3 tracking-widest">Growth Vector</div>
              <p className="text-xs text-[#5f6368] leading-relaxed">
                {insights?.opportunities?.[0] || "Analysis identifies significant overhead reduction through decentralized infrastructure."}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#dadce0] rounded-2xl p-8 shadow-sm">
             <label className="text-[10px] uppercase tracking-[0.2em] text-[#80868b] font-bold mb-6 block">Target Review Themes (Semantic)</label>
             <div className="h-[280px]">
               <KeywordFrequency themes={sentiment?.topThemes || ['Innovation', 'Scale', 'UX', 'Legacy', 'Support']} />
             </div>
          </div>
        </section>

        {/* Column 3: HERA Content Output (4 cols) */}
        <section className="col-span-12 lg:col-span-4 space-y-6 overflow-y-auto pr-2">
          <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#80868b] font-bold mb-6 block">HERA Visual Narrative Engine</label>
            <div className="aspect-video bg-[#f8f9fa] border border-[#dadce0] rounded-2xl overflow-hidden relative group cursor-pointer shadow-inner mb-6">
               <div className="absolute inset-0 flex items-center justify-center bg-[#1a73e8]/5 group-hover:bg-[#1a73e8]/10 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-white border border-[#dadce0] flex items-center justify-center pl-1 shadow-lg group-hover:scale-110 transition-transform">
                    <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-[#1a73e8] border-b-[10px] border-b-transparent"></div>
                  </div>
               </div>
               <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-white/80 backdrop-blur rounded-lg border border-[#dadce0] shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#ea4335] animate-pulse"></div>
                  <div className="text-[10px] text-[#5f6368] font-mono font-bold">SIM_ACTIVE</div>
               </div>
               <div className="absolute bottom-4 left-4">
                 <div className="text-[10px] text-[#1a73e8] bg-white px-3 py-1.5 rounded-lg shadow-sm border border-[#1a73e8]/10 font-bold uppercase font-mono tracking-widest">CEO_SCRIPT_DRAFTER</div>
               </div>
            </div>
            <div className="flex-1 bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-4 overflow-y-auto max-h-[300px]">
              <div className="text-[11px] text-[#5f6368] leading-relaxed font-serif prose prose-sm max-w-none">
                <ReactMarkdown>{content?.videoScript || "Synthesizing executive narrative flow..."}</ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[#80868b] font-bold block">Social Displacement Feed</label>
              <Linkedin size={18} className="text-[#0a66c2]" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-[#dadce0]">
              {content?.linkedInPosts?.map((post: any, i: number) => (
                <div key={i} className="p-5 bg-[#f8f9fa] border border-[#dadce0] rounded-2xl hover:border-[#1a73e8]/40 transition-colors shadow-sm">
                  <div className="text-[10px] font-mono text-[#1a73e8] font-bold uppercase tracking-widest mb-4 flex justify-between items-center">
                     <span>Node_{i+1}</span>
                     <span className="px-2 py-0.5 bg-white border border-[#dadce0] rounded text-[#5f6368] uppercase text-[9px] font-normal tracking-normal">{i === 0 ? 'INSIGHT' : 'FOUNDER'} Post</span>
                  </div>
                  <p className="text-[11px] text-[#3c4043] leading-relaxed whitespace-pre-wrap">{post}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Status Bar */}
      <footer className="h-10 border-t border-[#dadce0] bg-white flex items-center px-8 text-[10px] text-[#5f6368] justify-between font-mono tracking-widest shrink-0 z-10">
        <div className="flex gap-8">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" /> ENGINE_VER: EDGE_ELEVATE_X_2.4</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#34a853]" /> DATA_SOURCE: G2_FEDERATED</span>
        </div>
        <div className="flex gap-8 uppercase">
          <span className="text-[#bdc1c6]">BETA_INTERNAL_SCRAPE</span>
          <span className="flex items-center gap-2 text-[#202124]"><div className="w-1.5 h-1.5 rounded-full bg-[#1a73e8] animate-pulse" /> SOLVER_ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
