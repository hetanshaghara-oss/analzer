import React, { useMemo } from 'react';
import { calculateCommitStreak } from '../../services/github';
import SpotlightCard from '../ui/SpotlightCard';
import { Flame, TrendingUp, Calendar, Medal } from 'lucide-react';
import './StreakTracker.css';

const MILESTONES = [
  { days: 7,   label: 'Flame',   emoji: '🔥', color: '#f97316' },
  { days: 14,  label: 'Legend',  emoji: '⚡', color: '#eab308' },
  { days: 30,  label: 'Diamond', emoji: '💎', color: '#06b6d4' },
  { days: 100, label: 'Titan',   emoji: '🏆', color: '#8b5cf6' },
  { days: 365, label: 'Crown',   emoji: '👑', color: '#ec4899' },
];

// ── SVG flame (gradient body + glowing core, replaces the emoji) ────────────
const FlameMark = ({ intensity, active }) => {
  const gradId = 'streak-flame-grad';
  return (
    <svg
      className={`streak-flame-svg ${active ? 'is-lit' : 'is-idle'}`}
      viewBox="0 0 64 64"
      style={{ '--flame-opacity': 0.35 + intensity * 0.65 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={active ? '#ea580c' : '#64748b'} />
          <stop offset="100%" stopColor={active ? '#fbbf24' : '#94a3b8'} />
        </linearGradient>
      </defs>
      <path d="M32 5c-7 11-19 17-19 32a19 19 0 0 0 38 0c0-15-12-21-19-32z" fill={`url(#${gradId})`} />
      {active && (
        <path
          className="streak-flame-core"
          d="M32 24c-4 6-10 9-10 16a10 10 0 0 0 20 0c0-7-6-10-10-16z"
          fill="#fffbeb"
          opacity={0.55 + intensity * 0.35}
        />
      )}
    </svg>
  );
};

const StreakTracker = ({ events, repos }) => {
  const streak = useMemo(() => calculateCommitStreak(events, repos), [events, repos]);
  const { currentStreak, longestStreak, totalActiveDays, badges, isActive, recentDays = [] } = streak;

  const intensity = Math.min(currentStreak / 30, 1);
  const nextMilestone = MILESTONES.find(m => currentStreak < m.days) || null;
  const progress = nextMilestone ? Math.min(100, (currentStreak / nextMilestone.days) * 100) : 100;
  const daysToGo = nextMilestone ? nextMilestone.days - currentStreak : 0;
  const visibleMarks = nextMilestone ? MILESTONES.filter(m => m.days <= nextMilestone.days) : [];
  const activeCount = recentDays.filter(d => d.active).length;

  return (
    <SpotlightCard
      className="streak-card"
      spotlightColor={isActive ? 'rgba(249, 115, 22, 0.15)' : 'rgba(148, 163, 184, 0.08)'}
    >
      <div className="streak-inner">

        {/* Header */}
        <div className="streak-head">
          <span className="streak-title">
            <span className="streak-title-icon"><Flame size={16} /></span>
            Commit Streak
          </span>
          <span className={`streak-status ${isActive ? 'is-active' : 'is-idle'}`}>
            <span className="status-dot" />
            {isActive ? 'On Fire' : 'Idle'}
          </span>
        </div>

        {/* Hero */}
        <div className={`streak-hero ${isActive ? '' : 'is-idle'}`}>
          <FlameMark intensity={intensity} active={isActive} />
          <div className="streak-hero-copy">
            <div className="streak-count-row">
              <span className={`streak-count ${isActive ? '' : 'is-idle'}`}>{currentStreak}</span>
              <span className="streak-count-unit">days in a row</span>
            </div>
            <p className="streak-note">
              {isActive
                ? currentStreak >= 30
                  ? 'Legendary consistency — your repo history is on fire.'
                  : nextMilestone
                    ? `${daysToGo} day${daysToGo === 1 ? '' : 's'} to the ${nextMilestone.emoji} ${nextMilestone.days}-day ${nextMilestone.label.toLowerCase()} — keep pushing!`
                    : 'Keep pushing — every commit counts toward your next milestone.'
                : 'No active streak. Push some code today! 💪'}
            </p>
          </div>
        </div>

        {/* Milestone meter */}
        <div className="streak-meter">
          <div className="streak-meter-track">
            <div className="streak-meter-fill" style={{ width: `${progress}%` }} />
            {nextMilestone && <div className="streak-meter-marker" style={{ left: `${progress}%` }} />}
          </div>
          {visibleMarks.length > 0 && (
            <div className="streak-meter-marks">
              {visibleMarks.map(m => (
                <span key={m.days} style={{ left: `${(m.days / nextMilestone.days) * 100}%` }}>
                  {m.days}
                </span>
              ))}
            </div>
          )}
          <p className="streak-meter-label">
            <Medal size={13} />
            {nextMilestone ? (
              <>Next: {nextMilestone.emoji} <strong>{nextMilestone.days}-Day {nextMilestone.label}</strong> · {daysToGo} to go</>
            ) : (
              <>Crown achieved — you've hit the 365-day summit. 👑</>
            )}
          </p>
        </div>

        {/* 30-day activity strip */}
        <div className="streak-strip">
          <div className="streak-strip-cells">
            {recentDays.map(d => (
              <span
                key={d.date}
                className={`streak-cell ${d.active ? 'is-active' : ''}`}
                title={`${d.date}${d.active ? ' — committed' : ' — idle'}`}
              />
            ))}
          </div>
          <div className="streak-strip-meta">
            <span>Last 30 days</span>
            <span className="streak-strip-active-count">{activeCount} active</span>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="streak-stats">
          <div className="streak-stat-tile">
            <span className="streak-stat-tile-icon"><TrendingUp size={18} /></span>
            <div>
              <div className="streak-stat-value">{longestStreak}</div>
              <div className="streak-stat-label">Longest streak</div>
            </div>
          </div>
          <div className="streak-stat-tile">
            <span className="streak-stat-tile-icon"><Calendar size={18} /></span>
            <div>
              <div className="streak-stat-value">{totalActiveDays}</div>
              <div className="streak-stat-label">Active days</div>
            </div>
          </div>
          <div className="streak-stat-tile">
            <span className="streak-stat-tile-icon"><Medal size={18} /></span>
            <div>
              <div className="streak-stat-value">{badges.length}</div>
              <div className="streak-stat-label">Badges earned</div>
            </div>
          </div>
        </div>

      </div>
    </SpotlightCard>
  );
};

export default StreakTracker;
