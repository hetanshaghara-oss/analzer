import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  refreshWatchlist,
  fetchWatchlistDetail,
  markWatchlistRead,
} from '../services/monitoring';
import MonitorDetail from '../components/monitoring/MonitorDetail';
import { Radar, Plus, ExternalLink, RefreshCw, Trash2, Bell, Users } from 'lucide-react';
import '../components/monitoring/Monitoring.css';

function timeAgo(iso) {
  if (!iso) return 'never';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function DeltaBadge({ delta }) {
  if (!delta || delta === 0) return null;
  const pos = delta > 0;
  return (
    <span className={`watch-delta ${pos ? 'watch-delta--pos' : 'watch-delta--neg'}`}>
      {pos ? '+' : ''}
      {delta.toLocaleString()}
    </span>
  );
}

const WatchCard = ({ entry, onSelect, onRefresh, onRemove, refreshing }) => {
  const latest = entry.latest || {};
  const d = entry.latestDelta?.delta || {};
  return (
    <div className={`watch-card ${entry.unreadChanges ? 'watch-card--unread' : ''}`}>
      {entry.unreadChanges && (
        <div className="watch-unread-dot" title="New changes detected" />
      )}
      <button className="watch-card-main" onClick={() => onSelect(entry.githubUsername)}>
        {latest.avatar ? (
          <img className="watch-avatar" src={latest.avatar} alt={entry.githubUsername} />
        ) : (
          <div className="watch-avatar watch-avatar--fallback">
            {(entry.name || entry.githubUsername || 'G').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="watch-body">
          <div className="watch-name-row">
            <span className="watch-name">{entry.name || entry.githubUsername}</span>
            {entry.unreadChanges && <span className="watch-unread-badge">NEW</span>}
          </div>
          <span className="watch-handle">@{entry.githubUsername}</span>
          <div className="watch-stats">
            <span className="watch-stat">👥 {latest.followers ?? '—'}<DeltaBadge delta={d.followers} /></span>
            <span className="watch-stat">⭐ {latest.totalStars ?? '—'}<DeltaBadge delta={d.totalStars} /></span>
            <span className="watch-stat">📦 {latest.publicRepos ?? '—'}<DeltaBadge delta={d.publicRepos} /></span>
          </div>
          <span className="watch-checked">Checked {timeAgo(entry.lastCheckedAt)} · {entry.snapshotCount || 0} snapshots</span>
        </div>
      </button>
      <div className="watch-actions">
        <a
          href={entry.htmlUrl || `https://github.com/${entry.githubUsername}`}
          target="_blank"
          rel="noreferrer"
          className="watch-action-btn"
          title="Open on GitHub"
        >
          <ExternalLink size={15} />
        </a>
        <button
          className="watch-action-btn"
          onClick={() => onRefresh(entry.githubUsername)}
          disabled={refreshing === entry.githubUsername}
          title="Refresh snapshot"
        >
          <RefreshCw size={15} className={refreshing === entry.githubUsername ? 'spin' : ''} />
        </button>
        <button
          className="watch-action-btn watch-action-btn--danger"
          onClick={() => onRemove(entry.githubUsername)}
          title="Stop monitoring"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};

const MonitorDashboard = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [refreshing, setRefreshing] = useState(null);

  // Selected profile detail view.
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRefreshing, setDetailRefreshing] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWatchlist();
      setEntries(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load your watchlist.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openDetail = useCallback(async (username) => {
    setSelected(username);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await fetchWatchlistDetail(username);
      setDetail(data);
    } catch (err) {
      setDetailLoading(false);
      setSelected(null);
      setError(err.message || 'Failed to load profile details.');
    }
  }, []);

  const handleRefresh = useCallback(
    async (username) => {
      setRefreshing(username);
      try {
        await refreshWatchlist(username);
        if (selected === username) {
          const data = await fetchWatchlistDetail(username);
          setDetail(data);
        }
        await loadList();
      } catch (err) {
        setError(err.message || 'Refresh failed.');
      } finally {
        setRefreshing(null);
      }
    },
    [loadList, selected],
  );

  const refreshDetail = useCallback(async () => {
    if (!selected) return;
    setDetailRefreshing(true);
    try {
      const data = await fetchWatchlistDetail(selected);
      setDetail(data);
      await loadList();
    } catch (err) {
      setError(err.message || 'Refresh failed.');
    } finally {
      setDetailRefreshing(false);
    }
  }, [selected, loadList]);

  const handleMarkRead = useCallback(async () => {
    if (!selected) return;
    try {
      await markWatchlistRead(selected);
      setDetail((d) => (d ? { ...d, unreadChanges: false } : d));
      await loadList();
    } catch (err) {
      setError(err.message || 'Failed to mark as read.');
    }
  }, [selected, loadList]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const username = newUsername.trim();
    if (!username) return;
    setAdding(true);
    setAddError(null);
    try {
      const entry = await addToWatchlist(username);
      setNewUsername('');
      setEntries((prev) => [entry, ...prev]);
    } catch (err) {
      setAddError(err.message || 'Failed to add profile.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (username) => {
    if (!window.confirm(`Stop monitoring @${username}? Its history will be deleted.`)) return;
    try {
      await removeFromWatchlist(username);
      setEntries((prev) => prev.filter((e) => e.githubUsername !== username));
      if (selected === username) {
        setSelected(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to remove profile.');
    }
  };

  return (
    <div className="app-page monitor-page container py-10 animate-fade-in">
      <div className="stagger-1">
        <div className="monitor-header">
          <div>
            <span className="section-eyebrow">Keep an eye on growth</span>
            <h1 className="monitor-title">
              Profile <span className="text-gradient">Monitoring</span>
            </h1>
            <p className="section-subtitle">
              Watch any GitHub profile — snapshot history, change alerts, and a live activity feed.
            </p>
          </div>
          <div className="monitor-header-icon">
            <Radar size={34} />
          </div>
        </div>

        <form className="monitor-add-form" onSubmit={handleAdd}>
          <div className="monitor-add-field">
            <Users size={16} className="monitor-add-icon" />
            <input
              type="text"
              className="monitor-add-input"
              placeholder="Add a GitHub username to monitor…"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              aria-label="GitHub username to monitor"
            />
          </div>
          <button type="submit" className="btn-primary monitor-add-btn" disabled={adding || !newUsername.trim()}>
            <Plus size={16} /> {adding ? 'Adding…' : 'Monitor'}
          </button>
        </form>
        {addError && <p className="monitor-error">{addError}</p>}
        {error && <p className="monitor-error">{error}</p>}
      </div>

      {detail && selected ? (
        <MonitorDetail
          detail={detail}
          onBack={() => {
            setSelected(null);
            setDetail(null);
          }}
          onRefresh={refreshDetail}
          onMarkRead={handleMarkRead}
          refreshing={detailRefreshing}
        />
      ) : detailLoading ? (
        <div className="monitor-detail-loading">
          <RefreshCw size={30} className="spin" />
          <p>Fetching {selected}…</p>
        </div>
      ) : (
        <div className="stagger-2 mt-8">
          {loading ? (
            <div className="watch-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="watch-card watch-card--skeleton skeleton" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="monitor-empty">
              <Bell size={36} />
              <h3>Your watchlist is empty</h3>
              <p>
                Add a GitHub username above to start tracking followers, stars, and activity over time.
              </p>
            </div>
          ) : (
            <div className="watch-grid">
              {entries.map((entry) => (
                <WatchCard
                  key={entry.githubUsername}
                  entry={entry}
                  onSelect={openDetail}
                  onRefresh={handleRefresh}
                  onRemove={handleRemove}
                  refreshing={refreshing}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonitorDashboard;
