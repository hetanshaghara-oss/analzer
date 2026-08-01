import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Briefcase } from 'lucide-react';
import { parseLinkedInCSV } from '../../utils/linkedinParser';
import { useTypewriter } from '../../hooks/useTypewriter';
import { useCountUp } from '../../hooks/useCountUp';
import DashboardMockup from './DashboardMockup';
import FloatingOrbs from '../ui/FloatingOrbs';
import './Hero.css';

const TYPED_WORDS = ['any developer', 'any repository', 'any contribution graph', 'their skill tree', 'their DNA'];

const POPULAR = [
  'octocat', 'torvalds', 'gaearon', 'sindresorhus', 'yyx990803',
  'addyosmani', 'tj', 'kentcdodds', 'thepracticaldev', 'defunkt',
];

const Hero = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const typed = useTypewriter(TYPED_WORDS);

  const [username, setUsername] = useState('');
  const [focused, setFocused] = useState(false);
  const [linkedinData, setLinkedinData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Stats (scroll-triggered counters)
  const [statRef0, stat0] = useCountUp(10);
  const [statRef1, stat1] = useCountUp(5000);
  const [statRef2, stat2] = useCountUp(100);

  // Mouse parallax → pre-compute pixel offsets per layer into CSS vars
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    let raf = null;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--px1', `${(x * 30).toFixed(1)}px`);
        el.style.setProperty('--py1', `${(y * 20).toFixed(1)}px`);
        el.style.setProperty('--px2', `${(x * 44).toFixed(1)}px`);
        el.style.setProperty('--py2', `${(y * 30).toFixed(1)}px`);
        el.style.setProperty('--px3', `${(x * -44).toFixed(1)}px`);
        el.style.setProperty('--py3', `${(y * 30).toFixed(1)}px`);
        el.style.setProperty('--mockY', `${(y * -14).toFixed(1)}px`);
        raf = null;
      });
    };

    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  const submitSearch = (value) => {
    const q = (value ?? username).trim();
    if (!q) return;
    setAnalyzing(true);
    setTimeout(() => {
      navigate(`/dashboard/${q}`, { state: { linkedinData } });
    }, 650);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitSearch(username);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseLinkedInCSV(event.target.result);
        setLinkedinData(parsed);
        setUploadStatus(`✓ ${parsed.length} LinkedIn roles attached`);
      } catch (err) {
        setUploadStatus('Invalid LinkedIn CSV');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const trimmed = username.trim();
  const suggestions =
    focused && trimmed.length >= 2
      ? POPULAR.filter((u) => u.startsWith(trimmed.toLowerCase())).slice(0, 5)
      : [];

  // Deterministic ambient particles (stable per render, no flicker)
  const particles = useRef(
    Array.from({ length: 26 }, (_, i) => ({
      left: (i * 37) % 100,
      top: (i * 53) % 100,
      size: 2 + (i % 3),
      delay: (i % 8) * 0.9,
      dur: 6 + (i % 5) * 2,
    }))
  ).current;

  return (
    <section ref={heroRef} id="top" className="hero-section">
      {/* ── Ambient background ── */}
      <div className="hero-bg">
        <div className="hero-aurora hero-aurora--1" />
        <div className="hero-aurora hero-aurora--2" />
        <div className="hero-aurora hero-aurora--3" />
        <div className="hero-grid-floor" />
        <div className="hero-particles">
          {particles.map((p, i) => (
            <span
              key={i}
              className="hero-particle"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.dur}s`,
              }}
            />
          ))}
        </div>
        <FloatingOrbs />
      </div>

      <div className="container hero-inner">
        {/* ── Copy ── */}
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="pulse-dot" />
            GitInsight AI — Developer Intelligence Platform
          </div>

          <h1 className="hero-title">
            Decode <span className="hero-typed">{typed}<span className="hero-cursor">|</span></span>.<br />
            <span className="hero-gradient-text">Uncover the truth.</span>
          </h1>

          <p className="hero-subtitle">
            The most advanced GitHub analytics engine on the planet. Skill trees, DNA reports, battle arenas,
            world rankings — all in one beautiful dashboard.
          </p>

          {/* Search */}
          <div id="analyze" className="hero-search-anchor">
            <form
              onSubmit={handleSubmit}
              className={`hero-search-wrapper ${focused ? 'focused' : ''}`}
            >
              <div className="search-glow-border" />
              <div className="search-input-container">
                <Search className="search-icon" size={21} />
                <input
                  type="text"
                  placeholder="Enter any GitHub username…"
                  className="hero-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                />
                <button type="submit" className="hero-submit-btn">
                  Analyze <ArrowRight size={16} />
                </button>
              </div>

              {suggestions.length > 0 && (
                <div className="hero-suggestions">
                  {suggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="hero-suggestion"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setUsername(name);
                        submitSearch(name);
                      }}
                    >
                      <span className="hero-suggestion-avatar">{name[0].toUpperCase()}</span>
                      <span className="hero-suggestion-name">{name}</span>
                      <span className="hero-suggestion-arrow">↗</span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* LinkedIn upload */}
          <div className="hero-upload-row">
            <input
              type="file"
              accept=".csv"
              id="linkedin-upload"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label
              htmlFor="linkedin-upload"
              className={`linkedin-upload-btn ${uploadStatus.startsWith('✓') ? 'linkedin-upload-btn--success' : ''}`}
            >
              <Briefcase size={14} />
              {uploadStatus || 'Attach LinkedIn Positions.csv (Optional)'}
            </label>
          </div>

          {/* Stats */}
          <div className="hero-stats-row">
            <div className="hero-stat">
              <span className="hero-stat-num" ref={statRef0}>{stat0}<em>+</em></span>
              <span className="hero-stat-label">Features</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num" ref={statRef1}>{stat1}<em>+</em></span>
              <span className="hero-stat-label">API rate / hr</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num" ref={statRef2}>{stat2}<em>%</em></span>
              <span className="hero-stat-label">Free</span>
            </div>
          </div>
        </div>

        {/* ── Live product preview ── */}
        <div className="hero-mockup-wrap">
          <DashboardMockup username={username} analyzing={analyzing} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
