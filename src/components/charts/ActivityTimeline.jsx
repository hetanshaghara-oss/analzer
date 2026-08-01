import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';

const ActivityTimeline = ({ repos }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 w-full"></div>;

  // Group repos by creation year
  const timelineData = {};
  repos.forEach(repo => {
    const year = new Date(repo.created_at).getFullYear();
    if (!timelineData[year]) {
      timelineData[year] = { year, reposCreated: 0, totalStars: 0 };
    }
    timelineData[year].reposCreated += 1;
    timelineData[year].totalStars += repo.stargazers_count;
  });

  const chartData = Object.values(timelineData).sort((a, b) => a.year - b.year);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded shadow-md text-sm">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-accent-primary">Repos Created: <span className="font-bold">{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <h3 className="text-lg font-bold mb-4">Repository Creation Timeline</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRepos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent-primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--accent-primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border-color))" />
            <XAxis 
              dataKey="year" 
              tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }}
              stroke="hsl(var(--border-color))"
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }}
              stroke="hsl(var(--border-color))"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="reposCreated" 
              stroke="hsl(var(--accent-primary))" 
              fillOpacity={1} 
              fill="url(#colorRepos)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ActivityTimeline;
