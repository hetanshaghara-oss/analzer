import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';

const RepoBarChart = ({ repos, metric = 'stars' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    // Sort repos by chosen metric and take top 10
    const sorted = [...repos].sort((a, b) => {
      if (metric === 'stars') return b.stargazers_count - a.stargazers_count;
      if (metric === 'forks') return b.forks_count - a.forks_count;
      return b.size - a.size;
    });

    return sorted.slice(0, 10).map(repo => ({
      name: repo.name,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      size: (repo.size / 1024).toFixed(1) // Convert KB to MB for display
    }));
  }, [repos, metric]);

  if (!mounted) return <div className="h-64 w-full"></div>;

  const dataKey = metric === 'stars' ? 'stars' : (metric === 'forks' ? 'forks' : 'size');
  const fill = metric === 'stars' ? '#eab308' : (metric === 'forks' ? '#3b82f6' : '#22c55e');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded shadow-md text-sm">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-secondary capitalize">
            {metric}: <span className="font-bold" style={{ color: fill }}>{payload[0].value}</span>
            {metric === 'size' && ' MB'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Top Repositories by {metric.charAt(0).toUpperCase() + metric.slice(1)}</h3>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border-color))" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              tickMargin={10}
              stroke="hsl(var(--border-color))"
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }}
              stroke="hsl(var(--border-color))"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--border-color))', opacity: 0.4 }} />
            <Bar 
              dataKey={dataKey} 
              fill={fill} 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default RepoBarChart;
