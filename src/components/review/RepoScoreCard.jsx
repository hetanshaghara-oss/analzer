import React from 'react';
import Card from '../ui/Card';
import AnimatedCounter from '../ui/AnimatedCounter';

const ScoreRing = ({ score }) => {
  const color = score >= 75 ? '#22c55e' : score >= 55 ? '#eab308' : '#ef4444';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-ring-container">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--bg-tertiary))" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
        />
      </svg>
      <div className="score-ring-label">
        <span className="text-4xl font-extrabold" style={{ color }}>
          <AnimatedCounter value={score} />
        </span>
        <span className="text-xs text-muted uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
};

const CategoryBar = ({ label, value, color }) => (
  <div className="mb-4">
    <div className="flex justify-between text-sm mb-1">
      <span className="font-medium text-secondary">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
    <div className="progress-bg">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const RepoScoreCard = ({ scores }) => {
  return (
    <Card className="h-full">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="text-2xl">📊</span> Repository Score
      </h3>
      <div className="flex flex-col md-flex-row gap-8 items-center">
        <div className="shrink-0 text-center">
          <ScoreRing score={scores.overall} />
          <p className="text-sm text-secondary mt-2">Overall Score</p>
        </div>
        <div className="flex-1 w-full">
          {scores.categories.map((cat, i) => (
            <CategoryBar key={i} label={cat.label} value={cat.value} color={cat.color} />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default RepoScoreCard;
