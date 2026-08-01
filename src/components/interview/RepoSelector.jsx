import React, { useState } from 'react';
import { Star, GitFork, ChevronRight, Search } from 'lucide-react';

/* ══════════════════════════════════════
   RepoSelector — Step 1 of the interview.
   Shows the developer's repos and lets
   them pick one to be interviewed on.
══════════════════════════════════════ */

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Rust: '#dea584', Java: '#b07219', Go: '#00ADD8', 'C++': '#f34b7d',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
  Dart: '#00B4AB', Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c',
  Vue: '#41b883', Svelte: '#ff3e00', 'Jupyter Notebook': '#DA5B0B',
};

const RepoSelector = ({ repos, onSelect }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('stars');

  const filtered = repos
    .filter(r => !r.fork)
    .filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.language || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'stars') return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      if (sortBy === 'forks') return (b.forks_count || 0) - (a.forks_count || 0);
      if (sortBy === 'updated') return new Date(b.updated_at) - new Date(a.updated_at);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="repo-selector">
      <div className="repo-selector-header">
        <h2>Choose a Repository</h2>
        <p className="text-secondary">Pick the repo you want to be interviewed on. Questions will be generated from its code, languages, and structure.</p>
      </div>

      {/* Search & sort */}
      <div className="repo-selector-controls">
        <div className="repo-search-wrap">
          <Search size={16} className="repo-search-icon" />
          <input
            type="text"
            placeholder="Search repos…"
            className="repo-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="repo-sort-group">
          {['stars', 'forks', 'updated', 'name'].map(s => (
            <button
              key={s}
              className={`repo-sort-btn ${sortBy === s ? 'active' : ''}`}
              onClick={() => setSortBy(s)}
            >
              {s === 'updated' ? 'Recent' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Repo list */}
      <div className="repo-list-grid">
        {filtered.length === 0 && (
          <div className="repo-empty">
            {search ? 'No repos match your search.' : 'No non-forked repos found.'}
          </div>
        )}
        {filtered.map(repo => (
          <button
            key={repo.id}
            className="repo-select-card"
            onClick={() => onSelect(repo)}
          >
            <div className="repo-card-top">
              <div className="repo-card-lang">
                <span
                  className="lang-dot"
                  style={{ background: LANG_COLORS[repo.language] || '#999' }}
                />
                {repo.language || 'Unknown'}
              </div>
              <div className="repo-card-stats">
                {repo.stargazers_count > 0 && (
                  <span className="repo-stat"><Star size={13} /> {repo.stargazers_count.toLocaleString()}</span>
                )}
                {repo.forks_count > 0 && (
                  <span className="repo-stat"><GitFork size={13} /> {repo.forks_count.toLocaleString()}</span>
                )}
              </div>
            </div>

            <h3 className="repo-card-name">{repo.name}</h3>
            <p className="repo-card-desc">{repo.description || 'No description'}</p>

            <div className="repo-card-footer">
              <span className="repo-card-date">
                Updated {new Date(repo.updated_at).toLocaleDateString()}
              </span>
              <span className="repo-card-select">
                Interview on this repo <ChevronRight size={14} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RepoSelector;
