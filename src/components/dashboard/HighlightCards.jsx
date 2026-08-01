import React from 'react';
import { Link } from 'react-router-dom';
import { Star, GitFork, HardDrive, Clock, ExternalLink, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import './HighlightCards.css';

const HIGHLIGHT_COLORS = {
  yellow: { color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' },
  blue: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  green: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  purple: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
};

const HighlightItem = ({ title, repo, icon: Icon, accent, metaFormat }) => {
  if (!repo) return null;
  const tone = HIGHLIGHT_COLORS[accent];

  return (
    <Card className="highlight-card">
      <div className="highlight-head">
        <span className="highlight-icon" style={{ color: tone.color, background: tone.bg }}>
          <Icon size={18} />
        </span>
        <span className="highlight-label">{title}</span>
      </div>

      <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="highlight-repo" title={repo.name}>
        {repo.name}
      </a>
      <p className="highlight-desc">{repo.description || 'No description available'}</p>

      <Link to={`/review/${repo.owner.login}/${repo.name}`} className="highlight-ai">
        <Sparkles size={13} /> Review with AI
      </Link>

      <div className="highlight-meta">
        <span className="highlight-metric">{metaFormat(repo)}</span>
        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${repo.name}`}>
          <ExternalLink size={14} />
        </a>
      </div>
    </Card>
  );
};

const HighlightCards = ({ highlights }) => {
  return (
    <div className="highlight-grid">
      <HighlightItem
        title="Most Starred"
        repo={highlights.mostStarredRepo}
        icon={Star}
        accent="yellow"
        metaFormat={(repo) => `${repo.stargazers_count} Stars`}
      />
      <HighlightItem
        title="Most Forked"
        repo={highlights.mostForkedRepo}
        icon={GitFork}
        accent="blue"
        metaFormat={(repo) => `${repo.forks_count} Forks`}
      />
      <HighlightItem
        title="Largest Size"
        repo={highlights.largestRepo}
        icon={HardDrive}
        accent="green"
        metaFormat={(repo) => `${(repo.size / 1024).toFixed(1)} MB`}
      />
      <HighlightItem
        title="Recently Updated"
        repo={highlights.recentlyUpdatedRepo}
        icon={Clock}
        accent="purple"
        metaFormat={(repo) => new Date(repo.updated_at).toLocaleDateString()}
      />
    </div>
  );
};

export default HighlightCards;
