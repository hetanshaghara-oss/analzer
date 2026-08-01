import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import Reveal from './Reveal';
import './StatsSection.css';

const STATS = [
  { target: 25000, suffix: '+', label: 'Developers analyzed' },
  { target: 180000, suffix: '+', label: 'Repositories scanned' },
  { target: 4200000, suffix: '+', label: 'Commits processed' },
  { target: 120, suffix: '+', label: 'Countries reached' },
];

const StatCell = ({ stat }) => {
  const [ref, display] = useCountUp(stat.target, { duration: 1900 });
  return (
    <div className="stat-cell">
      <span className="stat-number" ref={ref}>
        {display}<em>{stat.suffix}</em>
      </span>
      <span className="stat-label">{stat.label}</span>
    </div>
  );
};

const StatsSection = () => {
  return (
    <section id="stats" className="stats-section">
      <div className="stats-glow" />
      <div className="container">
        <Reveal>
          <div className="stats-header">
            <p className="stats-eyebrow">In numbers</p>
            <h2 className="stats-title">
              GitInsight, <span className="text-gradient">by the numbers</span>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="stats-grid">
            {STATS.map((stat) => (
              <StatCell key={stat.label} stat={stat} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default StatsSection;
