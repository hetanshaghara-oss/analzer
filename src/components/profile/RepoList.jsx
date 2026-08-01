import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, GitFork, Search, Filter, ArrowUpDown, BookOpen, ExternalLink, Sparkles, GitBranch } from 'lucide-react';
import Card from '../ui/Card';
import './RepoList.css';

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C': '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  JupyterNotebook: '#DA5B0B',
  Dockerfile: '#384d54',
  SQL: '#e38c00',
};

const timeAgo = (dateStr) => {
  const diff = new Date() - new Date(dateStr);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
};

const RepoList = ({ repos, availableLanguages = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [languageFilter, setLanguageFilter] = useState('all');

  const filteredAndSortedRepos = useMemo(() => {
    let result = repos.filter((repo) => {
      const matchesSearch =
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesLanguage = languageFilter === 'all' || repo.language === languageFilter;
      return matchesSearch && matchesLanguage;
    });

    switch (sortBy) {
      case 'stars': result.sort((a, b) => b.stargazers_count - a.stargazers_count); break;
      case 'forks': result.sort((a, b) => b.forks_count - a.forks_count); break;
      case 'size': result.sort((a, b) => b.size - a.size); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'created': result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case 'updated':
      default: result.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)); break;
    }
    return result;
  }, [repos, searchTerm, sortBy, languageFilter]);

  return (
    <div className="repo-explorer">
      {/* Toolbar */}
      <div className="repo-toolbar">
        <div className="repo-toolbar-title">
          <span className="repo-toolbar-count">{filteredAndSortedRepos.length}</span>
          <h2>Repositories</h2>
        </div>

        <div className="repo-toolbar-controls">
          <div className="repo-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Find a repository…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="repo-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear search">×</button>
            )}
          </div>

          <div className="repo-select-wrap">
            <Filter size={14} />
            <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} aria-label="Filter by language">
              <option value="all">All languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang.name} value={lang.name}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div className="repo-select-wrap">
            <ArrowUpDown size={14} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort repositories">
              <option value="updated">Last updated</option>
              <option value="created">Recently created</option>
              <option value="stars">Most stars</option>
              <option value="forks">Most forks</option>
              <option value="size">Largest size</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredAndSortedRepos.length === 0 ? (
        <div className="repo-empty">
          <BookOpen size={30} />
          <p>No repositories found matching your criteria.</p>
        </div>
      ) : (
        <div className="repo-grid">
          {filteredAndSortedRepos.map((repo) => (
            <Card key={repo.id} className="repo-card">
              <div className="repo-card-top">
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="repo-name" title={repo.name}>
                  {repo.name}
                </a>
                <span className={`repo-visibility repo-visibility--${repo.visibility || 'public'}`}>
                  {repo.visibility || 'public'}
                </span>
              </div>

              <p className="repo-description">{repo.description || 'No description provided.'}</p>

              {repo.topics && repo.topics.length > 0 && (
                <div className="repo-topics">
                  {repo.topics.slice(0, 3).map((t) => (
                    <span key={t} className="repo-topic">{t}</span>
                  ))}
                </div>
              )}

              <div className="repo-card-actions">
                <Link to={`/review/${repo.owner.login}/${repo.name}`} className="repo-ai">
                  <Sparkles size={13} /> Review with AI
                </Link>
              </div>

              <div className="repo-meta">
                {repo.language && (
                  <span className="repo-meta-item" title="Language">
                    <span className="lang-dot" style={{ background: LANG_COLORS[repo.language] || '#94a3b8' }} />
                    {repo.language}
                  </span>
                )}
                {repo.stargazers_count > 0 && (
                  <span className="repo-meta-item" title="Stars">
                    <Star size={13} /> {repo.stargazers_count.toLocaleString()}
                  </span>
                )}
                {repo.forks_count > 0 && (
                  <span className="repo-meta-item" title="Forks">
                    <GitFork size={13} /> {repo.forks_count}
                  </span>
                )}
                <span className="repo-meta-item" title="Updated">
                  <GitBranch size={13} /> {timeAgo(repo.updated_at)}
                </span>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repo-meta-link"
                  aria-label={`Open ${repo.name}`}
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RepoList;
