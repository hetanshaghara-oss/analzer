import React, { useEffect, useMemo, useState } from 'react';
import { Star, GitFork, Users, Activity, Flame, ShieldCheck, Lock } from 'lucide-react';
import './DashboardMockup.css';

const LANGS = [
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'JavaScript', color: '#eab308' },
  { name: 'Python', color: '#3572A5' },
  { name: 'Rust', color: '#dea584' },
  { name: 'Go', color: '#00ADD8' },
  { name: 'Java', color: '#b07219' },
  { name: 'C++', color: '#f34b7d' },
];

const REPO_NAMES = ['core-engine', 'ui-kit', 'api-gateway', 'devtools', 'cli'];

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const rand = (seed, min, max) => Math.floor(min + ((seed % 9973) / 9973) * (max - min + 1));

/** Deterministically builds a "fake" profile from any username. */
function buildProfile(username) {
  const s1 = hashStr(username);
  const s2 = hashStr(`${username}!`);

  const score = rand(s1, 62, 99);
  const followers = rand(s2, 40, 8200);
  const repos = rand(s2 >>> 3, 12, 240);
  const stars = rand(s1, 300, 24000);
  const security = rand(s2 >>> 7, 76, 100);
  const streakDays = rand(s2 >>> 5, 6, 46);

  const pool = [...LANGS];
  const picked = [];
  for (let i = 0; i < 4; i++) {
    const idx = rand(s1 + i * 7, 0, pool.length - 1);
    picked.push(pool.splice(idx, 1)[0]);
  }
  const weights = [rand(s1, 30, 42), rand(s1 + 1, 18, 28), rand(s1 + 2, 10, 20), rand(s1 + 3, 6, 14)];
  const total = weights.reduce((a, b) => a + b, 0);
  const languages = picked.map((l, i) => ({ ...l, weight: Math.round((weights[i] / total) * 100) }));

  const week = Array.from({ length: 7 }, (_, i) => rand(s1 + i, 2, 20));
  const repoBars = REPO_NAMES.map((name, i) => ({ name, share: rand(s1 + i * 13, 15, 100) }));

  return { username, score, followers, repos, stars, security, streakDays, languages, week, repoBars };
}

const DashboardMockup = ({ username = '', analyzing = false }) => {
  const profile = useMemo(() => buildProfile(username.trim() || 'octocat'), [username]);
  const [displayScore, setDisplayScore] = useState(profile.score);
  const [showAnalyzing, setShowAnalyzing] = useState(false);

  // Animate the score number toward its new value
  useEffect(() => {
    const target = profile.score;
    const from = displayScore;
    if (target === from) return;

    let raf;
    let t0 = null;
    const step = (ts) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / 600, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.score]);

  // Analyzing overlay flash
  useEffect(() => {
    if (!analyzing) return;
    setShowAnalyzing(true);
    const t = setTimeout(() => setShowAnalyzing(false), 1400);
    return () => clearTimeout(t);
  }, [analyzing]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - displayScore / 100);

  // Build conic-gradient stops for the language donut
  let acc = 0;
  const donutStops = profile.languages.map((l) => {
    const from = acc;
    acc += l.weight;
    return `${l.color} ${from}% ${acc}%`;
  });

  const maxStreak = Math.max(...profile.week, 1);
  const maxBar = Math.max(...profile.repoBars.map((b) => b.share), 1);

  return (
    <div className="mockup-stage">
      {/* Floating chips */}
      <div className="mockup-chip mockup-chip--stars">
        <Star size={13} className="mockup-chip-icon" />
        <span><b>+{rand(profile.username.length * 31, 40, 260)}</b> stars this week</span>
      </div>
      <div className="mockup-chip mockup-chip--security">
        <ShieldCheck size={13} className="mockup-chip-icon" />
        <span>Security <b>{profile.security}/100</b></span>
      </div>

      <div className="mockup-browser">
        {/* Browser chrome */}
        <div className="mockup-toolbar">
          <span className="mockup-dots"><i /><i /><i /></span>
          <div className="mockup-url">
            <Lock size={11} />
            gitinsight.ai/{profile.username || 'octocat'}
          </div>
          <span className="mockup-pill">Live preview</span>
        </div>

        {/* Body */}
        <div className="mockup-body">
          {/* Left — profile */}
          <div className="mockup-side">
            <div className="mockup-avatar">{profile.username[0]?.toUpperCase() || 'G'}</div>
            <div className="mockup-name">{profile.username || 'octocat'}</div>
            <div className="mockup-login">@{profile.username || 'octocat'}</div>
            <div className="mockup-stats-mini">
              <div><span><GitFork size={11} /></span><b>{profile.repos.toLocaleString()}</b><em>repos</em></div>
              <div><span><Users size={11} /></span><b>{profile.followers.toLocaleString()}</b><em>followers</em></div>
            </div>
            <div className="mockup-level">
              <Activity size={12} />
              {displayScore >= 90 ? 'Legend' : displayScore >= 80 ? 'Backend Paladin' : displayScore >= 70 ? 'Full-Stack Ranger' : 'Frontend Mage'}
            </div>
          </div>

          {/* Right — score + charts */}
          <div className="mockup-main">
            <div className="mockup-score-card">
              <div className="mockup-ring-wrap">
                <svg className="mockup-ring" width="104" height="104" viewBox="0 0 104 104">
                  <circle cx="52" cy="52" r={radius} className="mockup-ring-track" />
                  <circle
                    cx="52" cy="52" r={radius}
                    className="mockup-ring-value"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <div className="mockup-ring-label">
                  <b>{displayScore}</b>
                  <span>GitInsight</span>
                </div>
              </div>

              <div className="mockup-donut-wrap">
                <div className="mockup-donut" style={{ background: `conic-gradient(${donutStops.join(', ')})` }}>
                  <div className="mockup-donut-hole" />
                </div>
                <div className="mockup-lang-list">
                  {profile.languages.map((l) => (
                    <span key={l.name}><i style={{ background: l.color }} />{l.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mockup-charts">
              <div className="mockup-chart-col">
                <p className="mockup-chart-label"><Flame size={12} /> Commit streak — {profile.streakDays} days</p>
                <div className="mockup-streak">
                  {profile.week.map((h, i) => (
                    <span
                      key={i}
                      className={`mockup-streak-bar ${h >= 18 ? 'mockup-streak-bar--hot' : ''}`}
                      style={{ height: `${(h / maxStreak) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mockup-chart-col">
                <p className="mockup-chart-label"><Star size={12} /> Top repos by stars</p>
                <div className="mockup-bars">
                  {profile.repoBars.slice(0, 4).map((b) => (
                    <div className="mockup-bar-row" key={b.name}>
                      <span className="mockup-bar-name">{b.name}</span>
                      <div className="mockup-bar-track">
                        <span className="mockup-bar-fill" style={{ width: `${(b.share / maxBar) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analyzing overlay */}
        {showAnalyzing && (
          <div className="mockup-analyzing">
            <div className="mockup-analyzing-inner">
              <span className="mockup-spinner" />
              <p>Analyzing <b>@{profile.username || 'octocat'}</b>…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMockup;
