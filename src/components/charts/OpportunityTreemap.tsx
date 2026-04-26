import React from 'react';
import { ResponsiveTreeMap } from '@nivo/treemap';
import type { ContentOpportunity } from '../../types/edgeElevate';

interface OpportunityTreemapProps {
  data: ContentOpportunity[];
}

export function OpportunityTreemap({ data }: OpportunityTreemapProps) {
  const formatMap: Record<string, string> = {
    'blog_post': 'Blog Post',
    'video': 'Video',
    'linkedin_post': 'LinkedIn',
    'reddit_thread': 'Reddit',
    'guest_article': 'Guest Article',
    'infographic': 'Infographic',
  };

  const colorMap: Record<string, string> = {
    'blog_post': '#3b82f6',
    'video': '#06b6d4',
    'linkedin_post': '#a855f7',
    'reddit_thread': '#ef4444',
    'guest_article': '#f59e0b',
    'infographic': '#10b981',
  };

  const treeData = {
    id: 'opportunities',
    children: data.map((opp, idx) => ({
      id: `opp_${idx}`,
      value: Math.max(opp.priority_score * 100, 1),
      format: formatMap[opp.format],
      title: opp.title,
      effort: opp.estimated_effort,
      channel: opp.channel,
      color: colorMap[opp.format],
    })),
  };

  return (
    <div className="w-full h-full">
      <ResponsiveTreeMap
        data={treeData}
        identity="id"
        label="format"
        labelSkipSize={12}
        labelTextColor="white"
        colors={({ data }) => data.color}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.1]],
        }}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      />
    </div>
  );
}
