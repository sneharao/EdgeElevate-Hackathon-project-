import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
} from 'recharts';

export function SentimentChart({ data }: { data: any }) {
  const chartData = [
    { name: 'Positive', value: data.positiveRatio || 65, color: '#34a853' },
    { name: 'Negative', value: data.negativeRatio || 20, color: '#ea4335' },
    { name: 'Neutral', value: 100 - (data.positiveRatio || 65) - (data.negativeRatio || 20), color: '#bdc1c6' },
  ];

  return (
    <div className="h-full w-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={80}
            stroke="#fff"
            strokeWidth={2}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #dadce0', borderRadius: '8px', fontSize: '10px' }}
            itemStyle={{ color: '#202124' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FeatureMatrix({ competitors }: { competitors: any[] }) {
  const features = ['Design', 'UX', 'AI Native', 'Openness', 'Ecosystem'];
  const data = features.map(f => {
    const obj: any = { feature: f };
    competitors.forEach(c => {
      obj[c.name] = Math.floor(Math.random() * 60) + 40; 
    });
    return obj;
  });

  const COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335'];

  return (
    <div className="h-full w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e8eaed" />
          <PolarAngleAxis dataKey="feature" stroke="#5f6368" fontSize={10} tick={{ fill: '#5f6368', fontWeight: 500 }} />
          {competitors.map((c, i) => (
            <Radar
              key={c.name}
              name={c.name}
              dataKey={c.name}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.1}
            />
          ))}
          <Tooltip 
             contentStyle={{ backgroundColor: '#fff', border: '1px solid #dadce0', borderRadius: '8px', fontSize: '10px' }}
          />
          <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }} />
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
    <div className="h-full w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: -20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="theme" type="category" stroke="#5f6368" width={100} fontSize={9} axisLine={false} tickLine={false} />
          <Tooltip 
             contentStyle={{ backgroundColor: '#fff', border: '1px solid #dadce0', borderRadius: '8px', fontSize: '10px' }}
             cursor={{ fill: '#f8f9fa' }}
          />
          <Bar dataKey="frequency" fill="#1a73e8" radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
