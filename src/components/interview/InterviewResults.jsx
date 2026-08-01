import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { TrendingUp, TrendingDown, RotateCcw, Star, Target, Zap } from 'lucide-react';

/* ══════════════════════════════════════
   InterviewResults — Step 3.
   Score card with radar chart, category
   breakdown, per-question feedback,
   strengths, and weaknesses.
══════════════════════════════════════ */

const CATEGORY_LABELS = {
  language: 'Language Knowledge',
  architecture: 'Architecture & Design',
  quality: 'Code Quality',
};

const InterviewResults = ({ results, context, overallScore, categoryScores, grade, summary, strengths, weaknesses, elapsed, onRetry }) => {
  // Radar chart data
  const radarData = Object.entries(categoryScores).map(([key, val]) => ({
    category: CATEGORY_LABELS[key] || key,
    score: val,
    fullMark: 100,
  }));

  // Bar chart data for per-question scores
  const barData = results.map((r, i) => ({
    name: `Q${i + 1}`,
    score: r.score,
    category: r.question.category,
  }));

  const barColors = barData.map(d => {
    if (d.score >= 70) return '#22c55e';
    if (d.score >= 50) return '#3b82f6';
    if (d.score >= 30) return '#f59e0b';
    return '#ef4444';
  });

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div className="interview-results">
      {/* Hero score */}
      <div className="results-hero">
        <div className="results-score-ring">
          <svg viewBox="0 0 120 120" className="results-score-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border-color))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={grade.color}
              strokeWidth="8"
              strokeDasharray={`${(overallScore / 100) * 327} 327`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className="results-score-arc"
            />
          </svg>
          <div className="results-score-inner">
            <span className="results-score-num">{overallScore}</span>
            <span className="results-score-max">/ 100</span>
          </div>
        </div>

        <div className="results-hero-info">
          <div className="results-grade" style={{ color: grade.color }}>
            {grade.letter}
          </div>
          <h2 className="results-grade-label">{grade.label}</h2>
          <p className="results-summary">{summary}</p>
          <div className="results-meta">
            <span><Target size={14} /> {results.length} questions</span>
            <span><Zap size={14} /> {formatTime(elapsed)}</span>
            <span><Star size={14} /> {context.primaryLanguage}</span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="results-charts-row">
        {/* Radar */}
        <div className="results-chart-card">
          <h3>Category Breakdown</h3>
          <div className="results-radar-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border-color))" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: 'hsl(var(--text-secondary))' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke={grade.color}
                  fill={grade.color}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-question bars */}
        <div className="results-chart-card">
          <h3>Question Scores</h3>
          <div className="results-bars-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--text-secondary))' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--bg-primary))',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={barColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="results-sw-row">
        <div className="results-sw-card strengths">
          <h3><TrendingUp size={18} /> Strengths</h3>
          {strengths.map((s, i) => (
            <div key={i} className="results-sw-item">
              <span className="results-sw-score" style={{ color: '#22c55e' }}>{s.score}%</span>
              <div>
                <p className="results-sw-q">{s.question}</p>
                <span className="results-sw-cat">{CATEGORY_LABELS[s.category] || s.category}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="results-sw-card weaknesses">
          <h3><TrendingDown size={18} /> Areas to Improve</h3>
          {weaknesses.map((w, i) => (
            <div key={i} className="results-sw-item">
              <span className="results-sw-score" style={{ color: w.score < 30 ? '#ef4444' : '#f59e0b' }}>{w.score}%</span>
              <div>
                <p className="results-sw-q">{w.question}</p>
                <span className="results-sw-missing">
                  Review: {w.missingKeywords.join(', ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-question details */}
      <div className="results-details">
        <h3>Detailed Feedback</h3>
        {results.map((r, i) => (
          <div key={i} className={`results-detail-card ${r.score >= 60 ? 'pass' : r.score >= 30 ? 'warn' : 'fail'}`}>
            <div className="results-detail-header">
              <span className="results-detail-num">Q{i + 1}</span>
              <span className="results-detail-score">{r.score}/100</span>
              <span className="results-detail-cat">{CATEGORY_LABELS[r.question.category]}</span>
            </div>
            <p className="results-detail-q">{r.question.question.split('\n')[0]}</p>
            {r.answer && (
              <div className="results-detail-answer">
                <strong>Your answer:</strong>
                <p>{r.answer.substring(0, 200)}{r.answer.length > 200 ? '…' : ''}</p>
              </div>
            )}
            <p className="results-detail-feedback">{r.feedback}</p>
            {r.matchedKeywords.length > 0 && (
              <div className="results-detail-keywords">
                Matched: {r.matchedKeywords.map(k => (
                  <span key={k} className="keyword-tag match">{k}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="btn-primary flex items-center gap-2" onClick={onRetry}>
          <RotateCcw size={16} /> Retake Interview
        </button>
      </div>
    </div>
  );
};

export default InterviewResults;
