import { useMemo } from 'react';
import { ResponsivePie } from '@nivo/pie';
import type { BrandMetrics } from '../../types/edgeElevate';

interface ShareOfVoicePieProps {
  data: BrandMetrics[];
  ownBrandId: string;
}

export function ShareOfVoicePie({ data, ownBrandId }: ShareOfVoicePieProps) {
  const pieData = useMemo(() => data
    .filter(b => b.brand_name && b.brand_name !== 'Unknown' && b.share_of_voice > 0)
    .map(b => ({
      id: b.brand_name || 'Brand',
      label: b.brand_name || 'Brand',
      value: Math.round(b.share_of_voice * 100),
      isOwn: b.brand_id === ownBrandId,
    })), [data, ownBrandId]);

  const ownBrand = data.find(b => b.brand_id === ownBrandId);
  const ownValue = ownBrand ? Math.round(ownBrand.share_of_voice * 100) : 0;

  if (pieData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--ink-dim)] italic">
        No share of voice data available
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <ResponsivePie
        data={pieData}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.6}
        padAngle={1}
        cornerRadius={3}
        valueFormat=">-.0f"
        colors={({ data }) => data.isOwn ? 'var(--accent)' : 'var(--line)'}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.2]],
        }}
        enableArcLinkLabels={false}
        arcLabelsSkipAngle={15}
        arcLabelsTextColor="var(--ink)"
        theme={{
          text: { fill: 'var(--ink-muted)' },
        }}
      />
      {/* Center metric */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-4xl font-light text-[var(--accent)]">{ownValue}%</div>
          <div className="text-xs text-[var(--ink-muted)] font-mono mt-2">SHARE OF VOICE</div>
        </div>
      </div>
    </div>
  );
}
