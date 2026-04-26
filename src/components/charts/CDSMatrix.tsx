import { useMemo } from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import type { CompetitiveDisplacementScore } from '../../types/edgeElevate';

interface CDSMatrixProps {
  data: CompetitiveDisplacementScore[];
}

export function CDSMatrix({ data }: CDSMatrixProps) {
  const heatmapData = useMemo(() => data.map(cds => ({
    id: cds.competitor_name || 'Competitor',
    data: [
      { x: 'Visibility', y: Math.round(Math.abs(cds.visibility_gap) * 100) },
      { x: 'Sentiment', y: Math.round(((cds.sentiment_delta + 100) / 200) * 100) },
      { x: 'Position', y: Math.round(cds.position_proximity * 100) },
      { x: 'Overlap', y: Math.round(cds.source_overlap_ratio * 100) },
    ],
  })), [data]);

  if (heatmapData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--ink-dim)] italic">
        No displacement data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveHeatMap
        data={heatmapData}
        margin={{ top: 40, right: 20, bottom: 40, left: 100 }}
        valueFormat=">-.0f"
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -35,
          legend: '',
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 8,
          tickRotation: 0,
          legend: '',
          legendPosition: 'middle',
          legendOffset: -80,
        }}
        colors={{
          type: 'sequential',
          scheme: 'blues',
        }}
        emptyColor="var(--surface-2)"
        labelTextColor="var(--ink)"
        theme={{
          text: { fill: 'var(--ink-muted)' },
          axis: {
            ticks: { text: { fill: 'var(--ink-muted)', fontSize: 11 } },
            legend: { text: { fill: 'var(--ink-muted)' } },
          },
        }}
        animate={false}
      />
    </div>
  );
}
