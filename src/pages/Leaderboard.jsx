import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLeaderboard } from "../services/github";
import { Users, BookOpen, Trophy, Globe, ChevronRight } from "lucide-react";
import SpotlightCard from "../components/ui/SpotlightCard";
import "./Leaderboard.css";

// Compute a GitInsight Score from a user's public data
const computeScore = (user) => {
  const followers = user.followers || 0;
  const repos = user.public_repos || 0;
  // Weighted formula: followers matter most, then repos
  return Math.round((followers * 0.7) + (repos * 2));
};

const RANK_CONFIG = [
  { min: 1,  max: 1,  label: '👑 Champion',   color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  { min: 2,  max: 3,  label: '🥈 Elite',       color: '#94a3b8', glow: 'rgba(148,163,184,0.3)' },
  { min: 4,  max: 10, label: '🥉 Legend',      color: '#b45309', glow: 'rgba(180,83,9,0.25)' },
  { min: 11, max: 30, label: '⭐ Expert',      color: '#6366f1', glow: 'rgba(99,102,241,0.2)' },
  { min: 31, max: 99, label: '🔷 Pro',         color: '#06b6d4', glow: 'rgba(6,182,212,0.15)' },
];

const getRankConfig = (rank) =>
  RANK_CONFIG.find(c => rank >= c.min && rank <= c.max) || { color: '#555', glow: 'none', label: 'Rookie' };

const CATEGORIES = [
  { id: 'followers',    label: 'Most Followed',   icon: Users,      key: 'followers' },
  { id: 'repositories', label: 'Most Repos',       icon: BookOpen,   key: 'public_repos' },
  { id: 'score',        label: 'GitInsight Score', icon: Trophy,     key: '_score' },
];

const Leaderboard = () => {
  const [category, setCategory] = useState("followers");
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchLeaderboard(category === 'score' ? 'followers' : category);
        if (isMounted) setData(result.items || []);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [category]);

  // Add computed score and sort
  const rankedData = useMemo(() => {
    let list = data.map(u => ({ ...u, _score: computeScore(u) }));
    if (category === 'score') list.sort((a, b) => b._score - a._score);
    return list.filter(u =>
      !search || u.login?.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, category, search]);

  const catCfg = CATEGORIES.find(c => c.id === category);

  return (
    <div className="lb2-page app-page">

      {/* ── Hero Header ── */}
      <div className="lb2-hero">
        <div className="lb2-hero-bg">
          <div className="lb2-hero-glow-1" />
          <div className="lb2-hero-glow-2" />
        </div>
        <div className="lb2-hero-content animate-fade-in">
          <div className="lb2-hero-badge">
            <Globe size={14} /> Live World Rankings
          </div>
          <h1 className="lb2-hero-title">
            Developer <span className="text-gradient">World Rankings</span>
          </h1>
          <p className="lb2-hero-subtitle">
            The most influential GitHub developers on the planet, ranked by followers, repositories, and GitInsight Score.
          </p>
        </div>
      </div>

      <div className="lb2-body container">

        {/* ── Controls Row ── */}
        <div className="lb2-controls animate-slide-up">
          <div className="lb2-cat-tabs">
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  className={`lb2-cat-btn ${category === c.id ? 'active' : ''}`}
                  onClick={() => setCategory(c.id)}
                >
                  <Icon size={16} /> {c.label}
                </button>
              );
            })}
          </div>
          <div className="lb2-search-box">
            <input
              type="text"
              placeholder="Filter rankings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="lb2-search-input"
            />
          </div>
        </div>

        {/* ── Top 3 Podium ── */}
        {!loading && !error && rankedData.length >= 3 && (
          <div className="lb2-podium animate-slide-up">
            {/* 2nd place */}
            <div className="lb2-podium-item lb2-podium-2">
              <img src={rankedData[1]?.avatar_url} alt={rankedData[1]?.login} className="lb2-podium-avatar" />
              <div className="lb2-podium-rank lb2-rank-2">2</div>
              <div className="lb2-podium-name">{rankedData[1]?.login}</div>
              <div className="lb2-podium-score">{(rankedData[1]?.[catCfg?.key === '_score' ? '_score' : category === 'repositories' ? 'public_repos' : 'followers'] || 0).toLocaleString()}</div>
              <div className="lb2-podium-base lb2-base-2" />
            </div>
            {/* 1st place */}
            <div className="lb2-podium-item lb2-podium-1">
              <div className="lb2-crown">👑</div>
              <img src={rankedData[0]?.avatar_url} alt={rankedData[0]?.login} className="lb2-podium-avatar lb2-avatar-1" />
              <div className="lb2-podium-rank lb2-rank-1">1</div>
              <div className="lb2-podium-name">{rankedData[0]?.login}</div>
              <div className="lb2-podium-score">{(rankedData[0]?.[catCfg?.key === '_score' ? '_score' : category === 'repositories' ? 'public_repos' : 'followers'] || 0).toLocaleString()}</div>
              <div className="lb2-podium-base lb2-base-1" />
            </div>
            {/* 3rd place */}
            <div className="lb2-podium-item lb2-podium-3">
              <img src={rankedData[2]?.avatar_url} alt={rankedData[2]?.login} className="lb2-podium-avatar" />
              <div className="lb2-podium-rank lb2-rank-3">3</div>
              <div className="lb2-podium-name">{rankedData[2]?.login}</div>
              <div className="lb2-podium-score">{(rankedData[2]?.[catCfg?.key === '_score' ? '_score' : category === 'repositories' ? 'public_repos' : 'followers'] || 0).toLocaleString()}</div>
              <div className="lb2-podium-base lb2-base-3" />
            </div>
          </div>
        )}

        {/* ── Full Rankings List ── */}
        {loading ? (
          <div className="lb2-skeleton-list">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="lb2-skeleton animate-pulse-slow" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : error ? (
          <div className="lb2-error">
            <Trophy size={48} color="#555" />
            <p>Failed to load rankings: {error}</p>
          </div>
        ) : (
          <div className="lb2-list animate-slide-up">
            {rankedData.map((user, index) => {
              const rank = index + 1;
              const cfg = getRankConfig(rank);
              const displayVal = category === 'repositories'
                ? (user.public_repos || 0).toLocaleString()
                : category === 'score'
                ? (user._score || 0).toLocaleString()
                : (user.followers || 0).toLocaleString();

              return (
                <SpotlightCard
                  key={user.id}
                  className="lb2-row"
                  spotlightColor={cfg.glow}
                  onClick={() => navigate(`/dashboard/${user.login}`)}
                >
                  <div className="lb2-row-inner">
                    {/* Rank */}
                    <div className="lb2-row-rank" style={{ color: cfg.color }}>
                      {rank <= 3
                        ? ['👑','🥈','🥉'][rank - 1]
                        : <span style={{ color: cfg.color }}>#{rank}</span>
                      }
                    </div>

                    {/* Avatar */}
                    <div className="lb2-row-avatar-wrap">
                      <img src={user.avatar_url} alt={user.login} className="lb2-row-avatar" />
                      {rank <= 3 && <div className="lb2-avatar-ring" style={{ borderColor: cfg.color, boxShadow: `0 0 12px ${cfg.color}` }} />}
                    </div>

                    {/* Info */}
                    <div className="lb2-row-info">
                      <div className="lb2-row-name">{user.name || user.login}</div>
                      <div className="lb2-row-login">@{user.login}</div>
                      {user.location && (
                        <div className="lb2-row-location">
                          <Globe size={12} /> {user.location}
                        </div>
                      )}
                    </div>

                    {/* Rank Label Badge */}
                    <div className="lb2-row-badge" style={{ color: cfg.color, background: `${cfg.color}18`, borderColor: `${cfg.color}44` }}>
                      {cfg.label}
                    </div>

                    {/* Score */}
                    <div className="lb2-row-score">
                      <div className="lb2-row-score-val" style={{ color: cfg.color }}>{displayVal}</div>
                      <div className="lb2-row-score-label">{catCfg?.label}</div>
                    </div>

                    {/* CTA */}
                    <ChevronRight size={20} className="lb2-row-arrow" />
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
