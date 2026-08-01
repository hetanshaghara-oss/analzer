import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Users, BookOpen, ArrowRight, RefreshCcw, X, Globe2, Code2,
} from 'lucide-react';
import { fetchDeveloperSearch } from '../../services/github';
import Reveal from './Reveal';
import './DeveloperDiscoverySection.css';

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Shell', 'Vue', 'Jupyter Notebook',
];

const COUNTRIES = [
  'india', 'united states', 'germany', 'united kingdom', 'brazil', 'canada',
  'japan', 'france', 'ukraine', 'nigeria', 'netherlands', 'poland', 'turkey',
  'indonesia', 'bangladesh', 'pakistan', 'egypt', 'spain', 'italy', 'south korea',
  'australia', 'argentina', 'mexico', 'romania', 'vietnam', 'philippines',
  'russia', 'sweden', 'switzerland', 'portugal', 'greece', 'china',
];

const COUNTRY_FLAGS = {
  india: '🇮🇳', 'united states': '🇺🇸', germany: '🇩🇪', 'united kingdom': '🇬🇧',
  brazil: '🇧🇷', canada: '🇨🇦', japan: '🇯🇵', france: '🇫🇷', ukraine: '🇺🇦',
  nigeria: '🇳🇬', netherlands: '🇳🇱', poland: '🇵🇱', turkey: '🇹🇷',
  indonesia: '🇮🇩', bangladesh: '🇧🇩', pakistan: '🇵🇰', egypt: '🇪🇬',
  spain: '🇪🇸', italy: '🇮🇹', 'south korea': '🇰🇷', australia: '🇦🇺',
  argentina: '🇦🇷', mexico: '🇲🇽', romania: '🇷🇴', vietnam: '🇻🇳',
  philippines: '🇵🇭', russia: '🇷🇺', sweden: '🇸🇪', switzerland: '🇨🇭',
  portugal: '🇵🇹', greece: '🇬🇷', china: '🇨🇳',
};

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219',
  Go: '#00ADD8', Rust: '#dea584', 'C++': '#f34b7d', 'C#': '#178600', Ruby: '#701516',
  PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', Shell: '#89e051',
  Vue: '#41b883', 'Jupyter Notebook': '#DA5B0B',
};

const titleCase = (s) => s.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const DeveloperCard = ({ dev, language, country }) => (
  <div className="dd-card">
    <div className="dd-card-top">
      <img src={dev.avatar_url} alt={dev.login} className="dd-avatar" loading="lazy" />
      <div className="dd-card-head">
        <h4 className="dd-name" title={dev.name || dev.login}>{dev.name || dev.login}</h4>
        <p className="dd-login">@{dev.login}</p>
      </div>
    </div>

    {dev.location && (
      <p className="dd-location">
        <MapPin size={13} /> {dev.location}
      </p>
    )}

    {(language || country) && (
      <div className="dd-tags">
        {language && (
          <span className="dd-tag">
            <span className="lang-dot" style={{ background: LANG_COLORS[language] || '#94a3b8' }} />
            {language}
          </span>
        )}
        {country && (
          <span className="dd-tag">
            {COUNTRY_FLAGS[country] || '🌍'} {titleCase(country)}
          </span>
        )}
      </div>
    )}

    <div className="dd-metrics">
      <span><Users size={13} /> {dev.followers.toLocaleString()} followers</span>
      <span><BookOpen size={13} /> {dev.public_repos} repos</span>
    </div>

    <Link to={`/dashboard/${dev.login}`} className="dd-view">
      View Profile <ArrowRight size={14} />
    </Link>
  </div>
);

const SkeletonCard = () => (
  <div className="dd-card dd-skeleton">
    <div className="dd-sk-avatar" />
    <div className="dd-sk-line dd-sk-line--title" />
    <div className="dd-sk-line dd-sk-line--sub" />
    <div className="dd-sk-line dd-sk-line--meta" />
  </div>
);

const DeveloperDiscoverySection = () => {
  const [language, setLanguage] = useState('');
  const [country, setCountry] = useState('');
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const runSearch = useCallback(async (lang, ctry, isInitial = false) => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchDeveloperSearch({ language: lang, country: ctry });
      setDevelopers(results);
    } catch (err) {
      setError(err.message || 'Failed to find developers');
      if (isInitial) setDevelopers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch('', '', true);
  }, [runSearch]);

  const hasFilters = Boolean(language || country);

  const handleSearch = () => runSearch(language, country);
  const clearFilters = () => {
    setLanguage('');
    setCountry('');
    runSearch('', '');
  };

  return (
    <section id="developers" className="dd-section">
      <div className="container">
        <Reveal>
          <div className="dd-header">
            <p className="dd-eyebrow"><Globe2 size={14} /> Developer Discovery</p>
            <h2 className="dd-title">
              Find developers by <span className="text-gradient">language &amp; country</span>
            </h2>
            <p className="dd-subtitle">
              Discover the world's open-source talent. Filter by the tech they build with,
              the country they build from — then dive into a full GitInsight report.
            </p>
          </div>
        </Reveal>

        {/* Filters */}
        <Reveal delay={80}>
          <div className="dd-panel">
            <div className="dd-field">
              <label htmlFor="dd-language"><Code2 size={15} /> Language</label>
              <select
                id="dd-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="">Any language</option>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="dd-field">
              <label htmlFor="dd-country"><MapPin size={15} /> Country</label>
              <select
                id="dd-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Anywhere</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {COUNTRY_FLAGS[c] || '🌍'} {titleCase(c)}
                  </option>
                ))}
              </select>
            </div>

            <div className="dd-actions">
              <button className="dd-search-btn" onClick={handleSearch} disabled={loading}>
                {loading ? <RefreshCcw size={16} className="dd-spin" /> : <Search size={16} />}
                Find Developers
              </button>
              {hasFilters && (
                <button className="dd-clear-btn" onClick={clearFilters}>
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {/* Results */}
        <div className="dd-results">
          {loading ? (
            <>
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </>
          ) : error ? (
            <div className="dd-state">
              <Search size={30} />
              <h4>Couldn't find developers</h4>
              <p>{error}</p>
              <button className="dd-retry" onClick={() => runSearch(language, country)}>Try again</button>
            </div>
          ) : developers.length === 0 ? (
            <div className="dd-state">
              <Globe2 size={30} />
              <h4>No developers found</h4>
              <p>Try widening your filters — fewer languages, or "Anywhere".</p>
            </div>
          ) : (
            developers.map((dev) => (
              <DeveloperCard key={dev.login} dev={dev} language={language} country={country} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default DeveloperDiscoverySection;
