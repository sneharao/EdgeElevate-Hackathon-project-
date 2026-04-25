import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
} from 'recharts';

export function SentimentChart({ data }: { data: any }) {
  const chartData = [
    { name: 'Positive', value: data.positiveRatio || 65, color: 'var(--chart-success)' },
    { name: 'Negative', value: data.negativeRatio || 20, color: 'var(--chart-error)' },
    { name: 'Neutral', value: 100 - (data.positiveRatio || 65) - (data.negativeRatio || 20), color: 'var(--chart-outline)' },
  ];

  return (
    <div className="chart-container h-full w-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FeatureMatrix({ competitors }: { competitors: any[] }) {
  const features = ['Design', 'UX', 'AI Native', 'Openness', 'Ecosystem'];
  const chartColors = ['var(--chart-primary)', 'var(--chart-success)', 'var(--chart-warning)', 'var(--chart-error)'];

  const data = features.map(f => {
    const obj: any = { feature: f };
    competitors.forEach(c => {
      obj[c.name] = Math.floor(Math.random() * 60) + 40;
    });
    return obj;
  });

  return (
    <div className="chart-container h-full w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="feature" />
          {competitors.map((c, i) => (
            <Radar
              key={c.name}
              name={c.name}
              dataKey={c.name}
              stroke={chartColors[i % chartColors.length]}
              fill={chartColors[i % chartColors.length]}
            />
          ))}
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KeywordFrequency({ themes }: { themes: string[] }) {
  const data = themes.map(t => ({
    theme: t,
    frequency: Math.floor(Math.random() * 50) + 10
  })).sort((a, b) => b.frequency - a.frequency);

  return (
    <div className="chart-container h-full w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: -20, right: 20 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chart-primary)" />
              <stop offset="100%" stopColor="var(--chart-secondary)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="theme" type="category" width={100} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="frequency" fill="url(#barGradient)" radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
