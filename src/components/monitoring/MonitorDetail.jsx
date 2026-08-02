import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, ExternalLink, RefreshCw, BellOff } from 'lucide-react';

const EVENT_META = {
  PushEvent: { emoji: '🔀', label: 'Pushed commits' },
  CreateEvent: { emoji: '🆕', label: 'Created' },
  WatchEvent: { emoji: '⭐', label: 'Starred' },
  ForkEvent: { emoji: '🍴', label: 'Forked' },
  IssuesEvent: { emoji: '🐛', label: 'Opened an issue' },
  IssueCommentEvent: { emoji: '💬', label: 'Commented' },
  PullRequestEvent: { emoji: '🔃', label: 'Opened a pull request' },
  PullRequestReviewEvent: { emoji: '🧐', label: 'Reviewed a pull request' },
  PullRequestReviewCommentEvent: { emoji: '💬', label: 'Reviewed a pull request' },
  ReleaseEvent: { emoji: '📦', label: 'Published a release' },
  DeleteEvent: { emoji: '🗑️', label: 'Deleted a ref' },
  MemberEvent: { emoji: '👥', label: 'Added a collaborator' },
  PublicEvent: { emoji: '🌍', label: 'Made a repo public' },
  GollumEvent: { emoji: '📝', label: 'Updated the wiki' },
};

const FALLBACK_META = { emoji: '⚡', label: 'Activity' };

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const DELTA_METRICS = [
  { key: 'followers', label: 'Followers', emoji: '👥' },
  { key: 'totalStars', label: 'Stars', emoji: '⭐' },
  { key: 'totalForks', label: 'Forks', emoji: '⑂' },
  { key: 'publicRepos', label: 'Repos', emoji: '📦' },
];

function DeltaCard({ metric, current, delta }) {
  const cls =
    delta > 0 ? 'watch-delta--pos' : delta < 0 ? 'watch-delta--neg' : '';
  return (
    <div className="monitor-delta-card">
      <span className="monitor-delta-emoji">{metric.emoji}</span>
      <div className="monitor-delta-info">
        <span className="monitor-delta-label">{metric.label}</span>
        <span className="monitor-delta-value">
          {(current ?? 0).toLocaleString()}
        </span>
      </div>
      {delta !== 0 && (
        <span className={`watch-delta ${cls}`}>
          {delta > 0 ? '+' : ''}
          {delta.toLocaleString()}
        </span>
      )}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="glass p-3 rounded-md shadow-md text-sm min-w-[130px]">
      <p className="font-bold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: 'hsl(var(--text-secondary))' }}>
          {entry.name}:{' '}
          <span className="font-bold" style={{ color: entry.color }}>
            {entry.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
};

function TrendChart({ title, data, dataKey, color, name, unit = '' }) {
  if (data.length < 2) {
    return (
      <div className="monitor-chart-card monitor-chart-empty">
        <h4>{title}</h4>
        <p>Not enough history yet — refresh this profile a couple of times to build a trend.</p>
      </div>
    );
  }
  return (
    <div className="monitor-chart-card">
      <h4>{title}</h4>
      <div className="monitor-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-color))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 11 }}
              stroke="hsl(var(--border-color))"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 11 }}
              stroke="hsl(var(--border-color))"
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v.toLocaleString()}${unit}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              name={name}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#grad-${dataKey})`}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const MonitorDetail = ({ detail, onBack, onRefresh, onMarkRead, refreshing }) => {
  const { snapshots, changeLog, activity } = detail;

  const chartData = useMemo(
    () =>
      (snapshots || []).map((s) => ({
        label: formatDate(s.at),
        followers: s.followers ?? 0,
        stars: s.totalStars ?? 0,
        repos: s.publicRepos ?? 0,
        forks: s.totalForks ?? 0,
      })),
    [snapshots],
  );

  const latestDeltas = useMemo(() => {
    const n = snapshots?.length || 0;
    if (n < 2) return {};
    const last = snapshots[n - 1];
    const prev = snapshots[n - 2];
    const d = {};
    for (const metric of DELTA_METRICS) d[metric.key] = (last[metric.key] || 0) - (prev[metric.key] || 0);
    return d;
  }, [snapshots]);

  const latest = snapshots?.[snapshots.length - 1] || {};

  return (
    <div className="monitor-detail animate-slide-up">
      <div className="monitor-detail-top">
        <button className="monitor-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to watchlist
        </button>
        <div className="monitor-detail-actions">
          <button
            className="btn-primary monitor-refresh-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Checking…' : 'Refresh now'}
          </button>
        </div>
      </div>

      {/* Profile header */}
      <div className="monitor-profile-card">
        {latest.avatar ? (
          <img className="monitor-profile-avatar" src={latest.avatar} alt={detail.githubUsername} />
        ) : (
          <div className="monitor-profile-avatar monitor-profile-avatar--fallback">
            {(detail.name || detail.githubUsername || 'G').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="monitor-profile-info">
          <h2 className="monitor-profile-name">
            {detail.name || detail.githubUsername}
            {detail.unreadChanges && <span className="watch-unread-badge">NEW</span>}
          </h2>
          <p className="monitor-profile-handle">@{detail.githubUsername}</p>
          {latest.bio && <p className="monitor-profile-bio">{latest.bio}</p>}
          <div className="monitor-profile-meta">
            <span>📍 {latest.location || 'No location'}</span>
            <span>🧠 {detail.snapshotCount} snapshot{detail.snapshotCount === 1 ? '' : 's'}</span>
            <span>⏱️ Last checked {timeAgo(detail.lastCheckedAt) || 'never'}</span>
          </div>
        </div>
        <div className="monitor-profile-links">
          <a href={detail.htmlUrl || `https://github.com/${detail.githubUsername}`} target="_blank" rel="noreferrer" className="chip">
            <ExternalLink size={14} /> GitHub
          </a>
          {detail.unreadChanges && (
            <button className="chip monitor-read-btn" onClick={onMarkRead}>
              <BellOff size={14} /> Mark as read
            </button>
          )}
        </div>
      </div>

      {/* Delta summary */}
      <div className="monitor-deltas">
        {DELTA_METRICS.map((m) => (
          <DeltaCard key={m.key} metric={m} current={latest[m.key]} delta={latestDeltas[m.key] ?? 0} />
        ))}
      </div>

      {/* Trend charts */}
      <div className="monitor-charts">
        <TrendChart title="Followers over time" data={chartData} dataKey="followers" color="#6366f1" name="Followers" />
        <TrendChart title="Total stars over time" data={chartData} dataKey="stars" color="#eab308" name="Stars" />
        <TrendChart title="Repositories over time" data={chartData} dataKey="repos" color="#22c55e" name="Repos" />
        <TrendChart title="Forks over time" data={chartData} dataKey="forks" color="#f43f5e" name="Forks" />
      </div>

      {/* Change log */}
      <div className="monitor-section">
        <h3 className="monitor-section-title">What changed</h3>
        {changeLog?.length > 0 ? (
          <div className="monitor-log">
            {changeLog.map((entry, i) => (
              <div key={i} className="monitor-log-item">
                <div className="monitor-log-time">{formatDateTime(entry.at)}</div>
                <ul className="monitor-log-changes">
                  {entry.changes.map((c, j) => (
                    <li key={j}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="monitor-empty-note">
            No changes recorded yet. Refresh periodically to catch growth, new repos, and profile edits.
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div className="monitor-section">
        <h3 className="monitor-section-title">Recent public activity</h3>
        {activity?.length > 0 ? (
          <div className="monitor-feed">
            {activity.map((evt) => {
              const meta = EVENT_META[evt.type] || FALLBACK_META;
              const repoName = evt.repo?.name || evt.repo?.url?.replace('https://api.github.com/repos/', '') || '';
              return (
                <div key={evt.id} className="monitor-feed-item">
                  <span className="monitor-feed-emoji">{meta.emoji}</span>
                  <div className="monitor-feed-body">
                    <p className="monitor-feed-text">
                      <strong>{meta.label}</strong>
                      {repoName && <span className="monitor-feed-repo">{repoName.split('/')[1]}</span>}
                    </p>
                    <span className="monitor-feed-time">{timeAgo(evt.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="monitor-empty-note">
            No recent public activity from this profile.
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitorDetail;
