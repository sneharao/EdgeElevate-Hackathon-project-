import { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { BrandMetrics } from '../../types/edgeElevate';

interface VisibilityBarsProps {
  data: BrandMetrics[];
  ownBrandId: string;
}

export function VisibilityBars({ data, ownBrandId }: VisibilityBarsProps) {
  const barData = useMemo(() => [...data]
    .filter(b => b.brand_name && b.brand_name !== 'Unknown')
    .sort((a, b) => b.visibility - a.visibility)
    .map(b => ({
      brand: b.brand_name || 'Brand',
      visibility: Math.round(b.visibility * 100),
      isOwn: b.brand_id === ownBrandId ? 1 : 0,
    })), [data, ownBrandId]);

  if (barData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--ink-dim)] italic">
        No visibility data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveBar
        data={barData}
        keys={['visibility']}
        indexBy="brand"
        margin={{ top: 10, right: 20, bottom: 50, left: 100 }}
        padding={0.3}
        layout="horizontal"
        valueScale={{ type: 'linear', max: 100 }}
        colors={({ data }) => data.isOwn === 1 ? 'var(--accent)' : 'var(--line)'}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.3]],
        }}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Visibility %',
          legendPosition: 'middle',
          legendOffset: 40,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
        }}
        label={d => `${d.value}%`}
        labelSkipWidth={30}
        labelSkipHeight={12}
        labelTextColor="var(--ink)"
        theme={{
          text: { fill: 'var(--ink-muted)' },
          axis: {
            ticks: { text: { fill: 'var(--ink-muted)', fontSize: 11 } },
            legend: { text: { fill: 'var(--ink-muted)' } },
          },
        }}
      />
    </div>
  );
}
