import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import AnimatedCounter from '../ui/AnimatedCounter';
import './AIComponents.css';

const ProgressBar = ({ label, value }) => (
  <div className="ai-progress">
    <div className="ai-progress-head">
      <span>{label}</span>
      <span>{value}/100</span>
    </div>
    <div className="progress-bg">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const DeveloperScoreCard = ({ scores }) => {
  return (
    <div className="ai-card">
      <h3 className="ai-card-title">
        <span className="ai-title-emoji">🏆</span> AI Developer Score
      </h3>

      <div className="ai-score-layout">
        <div className="score-circle">
          <span className="score-value">
            <AnimatedCounter value={scores.overall} />
          </span>
          <span className="score-label">Overall</span>
        </div>

        <div className="ai-radar-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scores.categories}>
              <PolarGrid stroke="hsl(var(--border-color))" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 10 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Score"
                dataKey="A"
                stroke="hsl(var(--accent-primary))"
                fill="hsl(var(--accent-primary))"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ai-progress-grid">
        {scores.categories.map((cat, idx) => (
          <ProgressBar key={idx} label={cat.subject} value={cat.A} />
        ))}
      </div>
    </div>
  );
};

export default DeveloperScoreCard;
