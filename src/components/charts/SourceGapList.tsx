import React from 'react';
import type { SourceGapEntry } from '../../types/edgeElevate';

interface SourceGapListProps {
  data: SourceGapEntry[];
}

export function SourceGapList({ data }: SourceGapListProps) {
  const sortedData = [...data]
    .sort((a, b) => b.citation_rate - a.citation_rate)
    .slice(0, 8);

  const getClassificationColor = (classification: string) => {
    const colors: Record<string, string> = {
      'EDITORIAL': 'bg-blue-500/20 text-blue-300',
      'UGC': 'bg-cyan-500/20 text-cyan-300',
      'REFERENCE': 'bg-purple-500/20 text-purple-300',
      'CORPORATE': 'bg-green-500/20 text-green-300',
    };
    return colors[classification] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="space-y-4">
      {sortedData.length > 0 ? sortedData.map((entry, idx) => (
        <div
          key={idx}
          className="glass-panel rounded-lg p-4 hover:bg-[var(--accent)]/[0.05] transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-mono text-[var(--ink)] truncate">{entry.domain}</div>
              <div className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded mt-2 ${getClassificationColor(entry.classification)}`}>
                {entry.classification}
              </div>
            </div>
          </div>

          {/* Citation rate bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-[var(--ink-muted)]">Current Citation Score</span>
              <span className="text-[10px] font-mono text-[var(--ink)]">{entry.citation_rate.toFixed(2)}</span>
            </div>
            <div className="h-1.5 bg-[var(--line)]/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent)] transition-all"
                style={{ width: `${Math.min((entry.citation_rate / 3) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Competitors */}
          {entry.competitors_present.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.competitors_present.map((comp, i) => (
                <div
                  key={i}
                  className="text-[9px] px-2 py-1 rounded bg-[var(--line)]/20 text-[var(--ink-muted)]"
                >
                  {comp}
                </div>
              ))}
            </div>
          )}
        </div>
      )) : (
        <div className="text-center py-10 text-xs text-[var(--ink-dim)] italic">No source gaps identified in this category</div>
      )}
    </div>
  );
}
