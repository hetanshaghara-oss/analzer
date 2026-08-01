import React, { useMemo } from 'react';
import { calculateDNAReport } from '../../services/github';
import SpotlightCard from '../ui/SpotlightCard';
import { Dna, Shield, Zap, Star, Users, Globe, TrendingUp, Moon } from 'lucide-react';
import './DNAReport.css';

const HabitBar = ({ label, value, color }) => (
  <div className="dna-habit-row">
    <div className="dna-habit-label">{label}</div>
    <div className="dna-habit-bar-bg">
      <div
        className="dna-habit-bar-fill"
        style={{ width: `${value}%`, background: color, boxShadow: `0 0 10px ${color}88` }}
      />
    </div>
    <div className="dna-habit-pct" style={{ color }}>{value}</div>
  </div>
);

const RiskBar = ({ label, value }) => {
  const color = value >= 70 ? '#ef4444' : value >= 40 ? '#f59e0b' : '#22c55e';
  const riskLabel = value >= 70 ? 'High' : value >= 40 ? 'Medium' : 'Low';
  return (
    <div className="dna-risk-row">
      <div className="dna-risk-label">{label}</div>
      <div className="dna-risk-bar-bg">
        <div
          className="dna-risk-bar-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <div className="dna-risk-tag" style={{ color, background: `${color}18`, borderColor: `${color}44` }}>
        {riskLabel}
      </div>
    </div>
  );
};

const HABIT_META = {
  consistency:   { label: 'Consistency',   color: '#6366f1' },
  collaboration: { label: 'Collaboration', color: '#3b82f6' },
  openSource:    { label: 'Open Source',   color: '#10b981' },
  diversity:     { label: 'Diversity',     color: '#f59e0b' },
  starPower:     { label: 'Star Power',    color: '#ec4899' },
  productivity:  { label: 'Productivity',  color: '#8b5cf6' },
};

const DNAReport = ({ userData, repos, events }) => {
  const dna = useMemo(() => calculateDNAReport(userData, repos, events), [userData, repos, events]);

  if (!dna) return null;

  // Overall score = average of habits
  const overallScore = Math.round(
    Object.values(dna.habits).reduce((s, v) => s + v, 0) / Object.values(dna.habits).length
  );

  return (
    <div className="dna-container animate-fade-in">

      {/* ── Header Banner ── */}
      <SpotlightCard className="dna-hero-card" spotlightColor="rgba(139,92,246,0.2)">
        <div className="dna-hero-inner">
          <div className="dna-hero-left">
            <div className="dna-icon-box">
              <Dna size={36} color="#8b5cf6" />
            </div>
            <div>
              <p className="dna-section-micro">Developer DNA Report</p>
              <h2 className="dna-hero-name">{userData?.name || userData?.login}</h2>
              <p className="dna-hero-login">@{userData?.login}</p>
            </div>
          </div>
          <div className="dna-hero-score-wrap">
            <div className="dna-score-ring">
              <svg viewBox="0 0 100 100" className="dna-score-svg">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#222" strokeWidth="10"/>
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#scoreGrad)" strokeWidth="10"
                  strokeDasharray={`${2.64 * overallScore} 264`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#ec4899"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="dna-score-inner">
                <div className="dna-score-num">{overallScore}</div>
                <div className="dna-score-label">Score</div>
              </div>
            </div>
          </div>
        </div>
      </SpotlightCard>

      <div className="dna-grid">

        {/* ── Personality Type ── */}
        <SpotlightCard className="dna-card dna-personality-card" spotlightColor="rgba(99,102,241,0.15)">
          <div className="dna-card-inner">
            <p className="dna-section-micro">Personality Matrix</p>
            <div className="dna-personality-emoji">{dna.personalityEmoji}</div>
            <h3 className="dna-personality-type">{dna.personalityType}</h3>
            <p className="dna-personality-desc">{dna.personalityDesc}</p>
            <div className="dna-meta-pills">
              <div className="dna-meta-pill"><Globe size={14}/> {dna.langCount} Languages</div>
              <div className="dna-meta-pill"><Star size={14}/> {dna.totalStars.toLocaleString()} Stars</div>
              {dna.isNightOwl && <div className="dna-meta-pill"><Moon size={14}/> Night Owl</div>}
            </div>
          </div>
        </SpotlightCard>

        {/* ── Coding Habits ── */}
        <SpotlightCard className="dna-card" spotlightColor="rgba(16,185,129,0.1)">
          <div className="dna-card-inner">
            <p className="dna-section-micro">Coding Habits</p>
            <h3 className="dna-card-title">Skill Profile</h3>
            <div className="dna-habits-list">
              {Object.entries(dna.habits).map(([key, val]) => (
                <HabitBar
                  key={key}
                  label={HABIT_META[key]?.label || key}
                  value={val}
                  color={HABIT_META[key]?.color || '#6366f1'}
                />
              ))}
            </div>
          </div>
        </SpotlightCard>

        {/* ── Risk Profile ── */}
        <SpotlightCard className="dna-card" spotlightColor="rgba(239,68,68,0.1)">
          <div className="dna-card-inner">
            <p className="dna-section-micro">Risk Assessment</p>
            <h3 className="dna-card-title">Risk Profile</h3>
            <p className="dna-card-sub">An AI analysis of potential technical and professional risks based on repository patterns.</p>
            <div className="dna-risks-list">
              {Object.entries(dna.risks).map(([key, val]) => (
                <RiskBar key={key} label={key} value={val} />
              ))}
            </div>
          </div>
        </SpotlightCard>

        {/* ── Specialty Badges ── */}
        <SpotlightCard className="dna-card" spotlightColor="rgba(245,158,11,0.1)">
          <div className="dna-card-inner">
            <p className="dna-section-micro">Achievements Unlocked</p>
            <h3 className="dna-card-title">Specialty Badges</h3>
            {dna.specialtyBadges.length === 0 ? (
              <p className="dna-card-sub" style={{ marginTop: '2rem' }}>Keep coding to unlock specialty badges! 🚀</p>
            ) : (
              <div className="dna-badges-grid">
                {dna.specialtyBadges.map(badge => (
                  <div key={badge.label} className="dna-badge" style={{
                    borderColor: badge.color,
                    boxShadow: `0 0 20px -8px ${badge.color}`,
                    background: `${badge.color}12`
                  }}>
                    <span className="dna-badge-emoji">{badge.emoji}</span>
                    <span className="dna-badge-label" style={{ color: badge.color }}>{badge.label}</span>
                    <span className="dna-badge-desc">{badge.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SpotlightCard>

      </div>
    </div>
  );
};

export default DNAReport;
