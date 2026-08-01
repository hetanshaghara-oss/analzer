import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchUserProfile, fetchUserRepositories, calculateStatistics } from '../services/github';
import { generateInitialBuilderState } from '../services/builderEngine';
import { parseJobDescription, matchDeveloperToJob, tailorBuilderState } from '../services/jobMatcher';
import {
  Target, Sparkles, ArrowRight, ArrowLeft, ClipboardList, Lightbulb, FolderGit2,
  CheckCircle2, XCircle, Star, Loader2, Wand2, Layers, Briefcase, TrendingUp, Gauge, ChevronRight,
} from 'lucide-react';
import './JobMatch.css';

// ── Sample job descriptions for quick demos ────────────────────────────────
const PRESETS = [
  {
    label: 'Senior Frontend Engineer',
    emoji: '🎨',
    text: `Senior Frontend Engineer — 5+ years

Required:
Strong experience with React, TypeScript, and modern JavaScript
Deep knowledge of Next.js, Tailwind CSS, and responsive web design
Building REST APIs and GraphQL clients
State management with Redux and testing with Jest
Git and GitHub Actions for CI/CD

Preferred:
Node.js, PostgreSQL, Docker
AWS or Vercel deployment
Open source contributions`,
  },
  {
    label: 'Backend Engineer (Node/Python)',
    emoji: '⚙️',
    text: `Backend Engineer (Node.js / Python) — 3+ years

Required:
Node.js, Express, or FastAPI experience
Strong SQL with PostgreSQL or MongoDB
REST API design and microservices architecture
Docker, Kubernetes, and cloud platforms (AWS/GCP)
Linux, Git, and CI/CD pipelines

Preferred:
Go, Redis, Kafka, GraphQL
Terraform, Jenkins automation`,
  },
  {
    label: 'Machine Learning Engineer',
    emoji: '🧠',
    text: `Machine Learning Engineer

Required:
Python, NumPy, Pandas, and scikit-learn
TensorFlow or PyTorch for deep learning
NLP, LLMs, OpenAI, and LangChain experience
Data pipelines and model deployment
Git and Docker

Preferred:
FastAPI, PostgreSQL
Kubernetes, AWS
Hugging Face`,
  },
  {
    label: 'DevOps / SRE Engineer',
    emoji: '🛠️',
    text: `DevOps / SRE Engineer — 4+ years

Required:
Docker, Kubernetes, and Helm
AWS, GCP, or Azure cloud infrastructure
Terraform, Ansible, and CI/CD pipelines
Linux systems administration and shell scripting
GitHub Actions, Jenkins, and monitoring

Preferred:
Go, Python, Nginx
Kafka, Elasticsearch`,
  },
];

const CATEGORY_CONFIG = {
  skills: { label: 'Skill Match', icon: CheckCircle2 },
  stack: { label: 'Stack Alignment', icon: Layers },
  level: { label: 'Experience Level', icon: Briefcase },
  projects: { label: 'Project Relevance', icon: FolderGit2 },
  activity: { label: 'Activity Momentum', icon: TrendingUp },
};

const scoreColor = v => (v >= 80 ? '#10b981' : v >= 65 ? '#3b82f6' : v >= 45 ? '#f59e0b' : '#ef4444');

const MatchSkeleton = () => (
  <div className="container mt-8 mb-12 animate-fade-in">
    <div className="skeleton mb-6" style={{ height: 120, borderRadius: 'var(--radius-2xl)' }} />
    <div className="jm-workspace">
      <div className="skeleton" style={{ height: 420, borderRadius: 'var(--radius-2xl)' }} />
      <div className="skeleton" style={{ height: 420, borderRadius: 'var(--radius-2xl)' }} />
    </div>
  </div>
);

// ── Animated score ring (SVG, no chart lib) ────────────────────────────────
const ScoreRing = ({ value, color }) => {
  const [progress, setProgress] = useState(0);
  const [shown, setShown] = useState(0);
  const r = 70;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    const t = setTimeout(() => setProgress(value), 40);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 900;
    const tick = now => {
      const p = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const offset = circumference - (circumference * Math.min(100, Math.max(0, progress))) / 100;

  return (
    <div className="jm-ring" aria-label={`${value}% overall match`}>
      <svg viewBox="0 0 170 170">
        <defs>
          <linearGradient id="jm-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <circle className="jm-ring-track" cx="85" cy="85" r={r} fill="none" strokeWidth="12" />
        <circle
          className="jm-ring-fill"
          cx="85" cy="85" r={r}
          fill="none"
          stroke="url(#jm-ring-grad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 85 85)"
        />
      </svg>
      <div className="jm-ring-label">
        <span className="jm-ring-value">{shown}%</span>
        <span className="jm-ring-caption">Overall match</span>
      </div>
    </div>
  );
};

const JobMatch = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [repoData, setRepoData] = useState([]);
  const [stats, setStats] = useState(null);
  const [builderState, setBuilderState] = useState(null);

  const [jdText, setJdText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [tailoredState, setTailoredState] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await fetchUserProfile(username);
        const repos = await fetchUserRepositories(username);
        const calculatedStats = calculateStatistics(repos);
        const state = generateInitialBuilderState(user, calculatedStats, repos);
        setUserData(user);
        setRepoData(repos);
        setStats(calculatedStats);
        setBuilderState(state);
      } catch (err) {
        setError(err.message || 'An error occurred while loading the profile');
      } finally {
        setLoading(false);
      }
    };
    if (username) loadData();
  }, [username]);

  const analyze = async () => {
    if (jdText.trim().length < 40 || !userData || !builderState || !stats || analyzing) return;
    setAnalyzing(true);
    setResult(null);
    setTailoredState(null);
    // Brief pause so the "AI is scoring" state is perceptible.
    await new Promise(r => setTimeout(r, 1100));
    const jd = parseJobDescription(jdText);
    const match = matchDeveloperToJob(jdText, userData, builderState, stats, repoData);
    const tailored = tailorBuilderState(builderState, match, jd, stats);
    setResult(match);
    setTailoredState(tailored);
    setAnalyzing(false);
  };

  if (loading) return <MatchSkeleton />;

  if (error) {
    return (
      <div className="app-page container mt-8 text-center animate-fade-in">
        <div className="glass jm-error-card rounded-xl max-w-md mx-auto">
          <h2 className="text-danger mb-4 text-2xl font-bold">Failed to load profile</h2>
          <p className="text-secondary mb-6">{error}</p>
          <Link to="/" className="btn-primary">Go Back Home</Link>
        </div>
      </div>
    );
  }

  if (!userData || !stats || !builderState) return null;

  const canAnalyze = jdText.trim().length >= 40;
  const charCount = jdText.trim().length;
  const dialColor = result ? scoreColor(result.overall) : '#3b82f6';
  const activePreset = PRESETS.find(p => p.text.trim() === jdText.trim());

  const handleTextChange = e => {
    setJdText(e.target.value);
    if (result || analyzing) { setResult(null); setTailoredState(null); setAnalyzing(false); }
  };

  const handlePreset = text => {
    setJdText(text);
    setResult(null);
    setTailoredState(null);
    setAnalyzing(false);
  };

  const levelText = result
    ? result.level !== 'unknown'
      ? `${result.level[0].toUpperCase()}${result.level.slice(1)} Level`
      : 'Level not specified'
    : '';

  return (
    <div className="app-page match-page">
      <div className="container mt-8 mb-12 animate-fade-in">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to={`/dashboard/${username}`} className="jm-back">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <header className="jm-header">
          <div className="jm-header-content">
            <div className="jm-logo">
              <Target size={24} />
            </div>
            <div className="jm-header-text">
              <span className="jm-eyebrow">AI Career Studio</span>
              <h1 className="jm-title">
                Job Match <em className="jm-title-accent">Studio</em>
              </h1>
              <p className="jm-subtitle">
                Paste any job description to score <strong className="text-primary">{username}</strong>'s alignment — then
                generate a resume &amp; portfolio tailored to that exact role.
              </p>
            </div>
          </div>
          <div className="jm-header-badge">
            <Gauge size={16} />
            {result ? `${result.overall}% match` : 'Heuristic engine'}
          </div>
        </header>

        {/* Workspace */}
        <div className="jm-workspace">
          {/* ── Left: JD input ── */}
          <section className="jm-panel">
            <div className="jm-panel-head">
              <span className="jm-panel-icon"><ClipboardList size={18} /></span>
              <div>
                <h3 className="jm-panel-title">Job Description</h3>
                <p className="jm-panel-desc">
                  Include the technologies, years, and level. A "Preferred / Nice to have" section is detected automatically.
                </p>
              </div>
            </div>

            <textarea
              value={jdText}
              onChange={handleTextChange}
              placeholder={`Paste a job description here, or try a preset below…`}
              className="jm-textarea"
            />

            <div className="jm-meta">
              <span>{canAnalyze ? 'Ready to analyze' : 'Paste ~40+ characters to enable analysis'}</span>
              <span className={`jm-count ${canAnalyze ? 'is-ok' : ''}`}>{charCount} chars</span>
            </div>

            <p className="jm-preset-label">Or try a preset role</p>
            <div className="jm-presets">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p.text)}
                  className={`jm-preset ${activePreset === p ? 'is-active' : ''}`}
                >
                  <span>{p.emoji}</span> {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={analyze}
              disabled={!canAnalyze || analyzing}
              className="jm-analyze"
            >
              {analyzing ? <Loader2 size={16} className="jm-spin" /> : <Sparkles size={16} />}
              {analyzing ? 'Scoring profile…' : 'Analyze Match'}
            </button>
            {!canAnalyze && (
              <p className="jm-analyze-hint">The match engine needs a real job description to work with.</p>
            )}
          </section>

          {/* ── Right: result ── */}
          <section className="jm-panel">
            {analyzing ? (
              <div className="jm-analyzing">
                <div className="jm-spinner-box"><Loader2 size={26} className="jm-spin" /></div>
                <h3>Scoring the profile…</h3>
                <p>Cross-referencing skills, stack, experience level, projects, and momentum against the job description.</p>
                <div className="jm-scan-lines">
                  <span style={{ width: '84%' }} />
                  <span style={{ width: '60%' }} />
                  <span style={{ width: '92%' }} />
                </div>
              </div>
            ) : result ? (
              <div className="jm-result">
                {/* Detected role */}
                <div className="jm-result-top">
                  <div>
                    <p className="jm-label">Detected role</p>
                    <h3 className="jm-role">{result.jobTitle}</h3>
                    <p className="jm-role-meta">
                      <Briefcase size={14} /> {result.roleFit.label}
                      <span>·</span>
                      <span>{levelText}</span>
                      {result.yearsRequired ? <><span>·</span><span>{result.yearsRequired}+ yrs</span></> : null}
                    </p>
                  </div>
                  <span
                    className="jm-verdict"
                    style={{ background: `${dialColor}1f`, color: dialColor, border: `1px solid ${dialColor}55` }}
                  >
                    {result.verdict}
                  </span>
                </div>

                {/* Score ring + categories */}
                <div className="jm-score">
                  <ScoreRing value={result.overall} color={dialColor} />
                  <div className="jm-cats">
                    {Object.entries(result.categories).map(([key, value]) => {
                      const cfg = CATEGORY_CONFIG[key] || { label: key, icon: Sparkles };
                      return (
                        <div key={key}>
                          <div className="jm-cat-head">
                            <span className="jm-cat-name"><cfg.icon size={13} /> {cfg.label}</span>
                            <span className="jm-cat-val" style={{ color: scoreColor(value) }}>{value}%</span>
                          </div>
                          <div className="jm-cat-track">
                            <div className="jm-cat-fill" style={{ width: `${value}%`, background: scoreColor(value) }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="jm-fit-note">{result.roleFit.note}</p>

                <button
                  onClick={() => navigate(`/builder/${username}`, { state: { tailored: tailoredState, jobTitle: result.jobTitle } })}
                  className="jm-tailor-btn"
                >
                  <Wand2 size={17} /> Generate Tailored Resume &amp; Portfolio <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="jm-empty">
                <div className="jm-empty-icon"><Sparkles size={30} /></div>
                <h3>Ready when you are</h3>
                <p>
                  Paste a job description (or pick a preset) and hit <strong className="text-primary">Analyze Match</strong>.
                  You'll get a weighted score across skills, stack, experience level, projects, and activity — with a tailored
                  resume generated in one click.
                </p>
                <div className="jm-steps">
                  <span><span className="jm-step-num">1</span>Paste JD</span>
                  <ChevronRight size={14} />
                  <span><span className="jm-step-num">2</span>Analyze</span>
                  <ChevronRight size={14} />
                  <span><span className="jm-step-num">3</span>Tailor</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Details row ── */}
        {result && (
          <div className="jm-details animate-fade-in">
            {/* Skills */}
            <div className="jm-panel jm-card">
              <div className="jm-card-head">
                <span className="jm-card-icon"><CheckCircle2 size={16} /></span>
                <h4>Skills Breakdown</h4>
              </div>

              {result.matchedSkills.length > 0 && (
                <>
                  <p className="jm-chip-label">
                    Matched <span className="jm-chip-count">{result.matchedSkills.length}</span>
                  </p>
                  <div className="jm-chips">
                    {result.matchedSkills.map(s => (
                      <span key={s} className="jm-chip jm-chip-match"><CheckCircle2 size={13} /> {s}</span>
                    ))}
                  </div>
                </>
              )}
              {result.matchedSkills.length === 0 && (
                <p className="jm-muted-line mb-2">No overlapping skills detected.</p>
              )}

              {result.missingSkills.length > 0 && (
                <>
                  <p className="jm-chip-label">
                    Missing · required <span className="jm-chip-count">{result.missingSkills.length}</span>
                  </p>
                  <div className="jm-chips">
                    {result.missingSkills.map(s => (
                      <span key={s} className="jm-chip jm-chip-miss"><XCircle size={13} /> {s}</span>
                    ))}
                  </div>
                </>
              )}

              {result.missingPreferred.length > 0 && (
                <>
                  <p className="jm-chip-label">
                    Missing · nice-to-have <span className="jm-chip-count">{result.missingPreferred.length}</span>
                  </p>
                  <div className="jm-chips">
                    {result.missingPreferred.map(s => (
                      <span key={s} className="jm-chip jm-chip-opt"><Star size={13} /> {s}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Relevant projects */}
            <div className="jm-panel jm-card">
              <div className="jm-card-head">
                <span className="jm-card-icon"><FolderGit2 size={16} /></span>
                <h4>Most Relevant Projects</h4>
              </div>
              {result.relevantProjects.length > 0 ? (
                result.relevantProjects.map((p, i) => (
                  <div key={p.name} className="jm-proj">
                    <span className="jm-proj-rank">{i + 1}</span>
                    <div className="jm-proj-body">
                      <div className="jm-proj-top">
                        <span className="jm-proj-name">{p.name}</span>
                        <span className="jm-proj-rel">{p.relevance} match{p.relevance === 1 ? '' : 'es'}</span>
                      </div>
                      <p className="jm-proj-desc">{p.description}</p>
                      <div className="jm-proj-meta">
                        {p.language && <span className="jm-dot" />}
                        {p.language && <span>{p.language}</span>}
                        <span className="flex items-center gap-1"><Star size={12} /> {p.stars}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="jm-muted-line">No repositories surfaced keywords from this job description.</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="jm-panel jm-card">
              <div className="jm-card-head">
                <span className="jm-card-icon"><Lightbulb size={16} /></span>
                <h4>Match Recommendations</h4>
              </div>
              <div>
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="jm-rec">
                    <span className="jm-rec-dot">{i + 1}</span>
                    <p>{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobMatch;
