import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileCode2, Flame, Award, X, Copy, Check, RefreshCcw, Sparkles, Zap,
} from 'lucide-react';
import {
  generateProfileReadme, generateProfileRoast, generateBadges,
} from '../../services/agentGenerators';
import ErrorBoundary from '../ui/ErrorBoundary';
import './AIAgents.css';

const AGENTS = [
  {
    id: 'readme',
    icon: FileCode2,
    title: 'README Generator',
    desc: 'Craft a polished GitHub profile README from your real stats — bio, badges, languages and more.',
    color: '#6366f1',
    accent: 'rgba(99, 102, 241, 0.14)',
    tag: 'Agent 01',
  },
  {
    id: 'roast',
    icon: Flame,
    title: 'Profile Roast',
    desc: 'Let the AI drag you. A brutally honest, data-driven roast of your GitHub history.',
    color: '#f43f5e',
    accent: 'rgba(244, 63, 94, 0.14)',
    tag: 'Agent 02',
  },
  {
    id: 'badges',
    icon: Award,
    title: 'Badge Generator',
    desc: 'Generate share-ready shields badges for your followers, stars, languages and more.',
    color: '#10b981',
    accent: 'rgba(16, 185, 129, 0.14)',
    tag: 'Agent 03',
  },
];

const useCopy = () => {
  const [copiedKey, setCopiedKey] = useState(null);
  const copy = useCallback(async (text, key = 'main') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }, []);
  return [copiedKey, copy];
};

// Shields.io badge colors → local CSS preview colors
const SHIELD_COLORS = {
  blue: '#007ec6',
  blueviolet: '#8a2be2',
  brightgreen: '#4c1',
  green: '#97ca00',
  yellow: '#dfb317',
  orange: '#fe7d37',
  lightgrey: '#9f9f9f',
  red: '#e05d44',
};

const safe = (fn, fallback) => {
  try {
    return fn();
  } catch (err) {
    console.error('[AI Agent] generation failed:', err);
    return fallback;
  }
};

/* ── Modal (extracted so it's independently testable) ── */
export const AgentModal = ({
  agent, active, profile, stats, repos, readme, roast, badges,
  copiedKey, copy, onClose, onReroll,
}) => {
  const Icon = agent.icon;
  const copyMain = () =>
    copy(active === 'readme' ? readme : active === 'roast' ? roast : badges?.markdown, 'main');

  return (
    <div className="agent-overlay" onClick={onClose}>
      <div className="agent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="agent-modal-head" style={{ background: `linear-gradient(135deg, ${agent.color}1a, ${agent.color}0d)` }}>
          <span className="agent-modal-icon" style={{ background: agent.accent, color: agent.color }}>
            <Icon size={22} />
          </span>
          <div>
            <span className="agent-modal-tag">{agent.tag}</span>
            <h3 className="agent-modal-title">{agent.title}</h3>
          </div>
          <button className="agent-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="agent-modal-body">
          {active === 'readme' && (
            <>
              <p className="agent-modal-hint">
                A ready-to-paste GitHub profile README, generated from {profile?.login}'s live stats.
              </p>
              <pre className="agent-code">{readme}</pre>
            </>
          )}

          {active === 'roast' && (
            <>
              <p className="agent-modal-hint">Powered by your commit history. Read at your own risk.</p>
              <div className="roast-card">
                {roast.split('\n\n').map((line, i) => (
                  <p key={i} className="roast-line">{line}</p>
                ))}
              </div>
              <button className="roast-again" onClick={onReroll}>
                <RefreshCcw size={14} /> Roast again
              </button>
            </>
          )}

          {active === 'badges' && badges && (
            <>
              <p className="agent-modal-hint">
                Each badge shows a live preview, its shields.io URL, and the markdown tag — paste it into your README.
              </p>

              <div className="badges-list">
                {badges.items.map((b) => (
                  <div className="badge-row" key={b.label}>
                    <span className="badge-chip">
                      <span className="badge-chip-label">{b.label}</span>
                      <span className="badge-chip-value" style={{ background: SHIELD_COLORS[b.color] || '#9f9f9f' }}>
                        {b.value}
                      </span>
                    </span>
                    <code className="badge-url" title={b.url}>{b.url}</code>
                    <button className="badge-copy" onClick={() => copy(b.markdown, b.label)} aria-label={`Copy ${b.label} markdown`}>
                      {copiedKey === b.label ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                ))}
              </div>

              <div className="badges-code-cols">
                <div>
                  <p className="badges-label">Markdown — all badges</p>
                  <pre className="agent-code">{badges.markdown}</pre>
                </div>
                <div>
                  <p className="badges-label">HTML — all badges</p>
                  <pre className="agent-code">{badges.html}</pre>
                </div>
              </div>
            </>
          )}

          <button className="agent-copy" onClick={copyMain}>
            {copiedKey === 'main' ? <Check size={15} /> : <Copy size={15} />}
            {copiedKey === 'main' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AIAgents = ({ profile, stats, repos }) => {
  const [active, setActive] = useState(null); // null | 'readme' | 'roast' | 'badges'
  const [variant, setVariant] = useState(0);
  const [copiedKey, copy] = useCopy();

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    try {
      document.body.style.overflow = active ? 'hidden' : '';
    } catch {
      /* ignore */
    }
    return () => {
      try { document.body.style.overflow = ''; } catch { /* ignore */ }
    };
  }, [active]);

  const readme = useMemo(
    () => (profile ? safe(() => generateProfileReadme(profile, stats), '# Your README could not be generated.') : ''),
    [profile, stats],
  );
  const roast = useMemo(
    () => (profile ? safe(() => generateProfileRoast(profile, stats, repos, variant), 'The roast engine is on a break.') : ''),
    [profile, stats, repos, variant],
  );
  const badges = useMemo(
    () => (profile ? safe(() => generateBadges(profile, stats), null) : null),
    [profile, stats],
  );

  const agent = AGENTS.find((a) => a.id === active);

  return (
    <section className="ai-agents">
      <div className="section-heading">
        <span className="section-eyebrow"><Zap size={13} /> Agent toolkit</span>
        <h3 className="section-title">AI Agents</h3>
        <p className="section-subtitle">
          Three focused agents, each weaponized with {profile?.login ? `@${profile.login}'s` : 'your'} real GitHub data.
        </p>
      </div>

      <div className="agents-grid">
        {AGENTS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="agent-card"
              style={{ '--agent-color': a.color, '--agent-accent': a.accent }}
              onClick={() => { setActive(a.id); setVariant(0); }}
            >
              <span className="agent-tag">{a.tag}</span>
              <span className="agent-icon"><Icon size={24} /></span>
              <h4 className="agent-title">{a.title}</h4>
              <p className="agent-desc">{a.desc}</p>
              <span className="agent-launch">Launch <Sparkles size={13} /></span>
            </button>
          );
        })}
      </div>

      {agent && (
        <ErrorBoundary>
          <AgentModal
            agent={agent}
            active={active}
            profile={profile}
            stats={stats}
            repos={repos}
            readme={readme}
            roast={roast}
            badges={badges}
            copiedKey={copiedKey}
            copy={copy}
            onClose={close}
            onReroll={() => setVariant((v) => v + 1)}
          />
        </ErrorBoundary>
      )}
    </section>
  );
};

export default AIAgents;
