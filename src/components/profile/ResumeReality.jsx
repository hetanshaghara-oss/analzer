import React, { useMemo, useRef, useState } from 'react';
import {
  Upload, ShieldCheck, Briefcase, Code2, GitBranch,
  Building2, TrendingUp, AlertTriangle, Check, Minus, ExternalLink, FileText, Star,
} from 'lucide-react';
import { parseLinkedInCSV } from '../../utils/linkedinParser';
import './ResumeReality.css';

/* ═══════════ Analysis engine (pure, deterministic) ═══════════ */

const parseDate = (str) => {
  if (!str) return null;
  const s = String(str).trim();
  if (!s || /unknown/i.test(s)) return null;
  if (/present|current|now/i.test(s)) return new Date();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  const m = s.match(/(\d{4})/);
  if (m) return new Date(Number(m[1]), 0, 1);
  return null;
};

const TECH_ALIASES = {
  JavaScript: ['javascript', 'react', 'node.js', 'node', 'next.js', 'vue', 'frontend', 'fullstack', 'redux', 'graphql', 'tailwind', 'web'],
  TypeScript: ['typescript', 'angular', 'react', 'next.js', 'frontend'],
  Python: ['python', 'django', 'flask', 'fastapi', 'machine learning', 'data science', 'tensorflow', 'pytorch', 'pandas', 'automation'],
  Java: ['java', 'spring', 'hibernate'],
  Kotlin: ['kotlin', 'android'],
  Go: ['golang', 'kubernetes', 'k8s', 'docker', 'devops', 'terraform', 'aws'],
  Rust: ['rust'],
  'C++': ['c++', 'cpp', 'unreal'],
  'C#': ['c#', 'csharp', '.net', 'dotnet', 'unity'],
  PHP: ['php', 'laravel', 'wordpress'],
  Ruby: ['ruby', 'rails'],
  Swift: ['swift', 'ios', 'xcode'],
  Dart: ['dart', 'flutter'],
  SQL: ['sql', 'postgres', 'postgresql', 'mysql', 'mongodb', 'database'],
  Shell: ['shell', 'bash', 'ci/cd'],
  CSS: ['css', 'sass', 'tailwind', 'html'],
};

const SENIOR_TERMS = ['senior', 'staff', 'principal', 'lead', 'manager', 'architect', 'director', 'cto', 'vp', 'founder', 'head of'];

const VERDICT_META = {
  strong: { label: 'Supported by public code', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  partial: { label: 'Partially supported', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  weak: { label: 'Thin public footprint', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  none: { label: 'No public evidence', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  conflict: { label: 'Conflicts with public code', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  na: { label: 'Not assessed', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

const SCORE_WEIGHT = { strong: 1, partial: 0.5, weak: 0.3, conflict: 0.1, none: 0.45, na: 0.65 };
const W = { stack: 0.3, window: 0.35, seniority: 0.2, company: 0.15 };

const stackAnalysis = (claimText, languages) => {
  const t = ` ${(claimText || '').toLowerCase()} `;
  const claimed = new Set();
  for (const [lang, aliases] of Object.entries(TECH_ALIASES)) {
    if (aliases.some((a) => t.includes(` ${a} `) || t.includes(` ${a}`))) claimed.add(lang);
  }

  const actual = (languages || []).slice(0, 6).map((l) => l.name);
  if (claimed.size === 0) {
    return { verdict: 'none', note: 'Claim lists no specific tech to verify', claimed: [], actual };
  }
  const matched = [...claimed].filter((c) => actual.includes(c));
  const ratio = claimed.size ? matched.length / claimed.size : 0;
  if (ratio >= 0.5) return { verdict: 'strong', note: `${matched.length}/${claimed.size} claimed stacks match`, matched, claimed: [...claimed], actual };
  if (ratio > 0) return { verdict: 'partial', note: `Only ${matched.length}/${claimed.size} stacks appear`, matched, claimed: [...claimed], actual };
  return { verdict: 'conflict', note: 'Claimed stacks not found in public repos', matched, claimed: [...claimed], actual };
};

const windowAnalysis = (job, repos) => {
  const start = parseDate(job.startDate);
  if (!start) return { verdict: 'none', note: 'Start date unknown', evidence: [], ratio: 0.5 };
  const end = parseDate(job.endDate) || new Date();
  const lo = new Date(start); lo.setMonth(lo.getMonth() - 6);
  const hi = new Date(end); hi.setMonth(hi.getMonth() + 3);

  const evidence = (repos || []).filter((r) => {
    const c = new Date(r.created_at);
    const p = new Date(r.pushed_at);
    return (c >= lo && c <= hi) || (p >= lo && p <= hi);
  });

  const total = repos?.length || 0;
  const ratio = total ? evidence.length / total : 0;
  const verdict = ratio >= 0.6 ? 'strong' : ratio >= 0.3 ? 'partial' : 'none';
  const note = evidence.length
    ? `${evidence.length} repo${evidence.length > 1 ? 's' : ''} active in this period`
    : 'No public repo activity in this period';
  return { verdict, evidence, ratio, note };
};

const seniorityAnalysis = (job, profile, repos) => {
  const t = ` ${(job.title || '').toLowerCase()} `;
  const isSenior = SENIOR_TERMS.some((term) => t.includes(term));
  if (!isSenior) return { verdict: 'na', note: 'No seniority claim to check', value: 0.5 };

  const totalStars = (repos || []).reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const n = repos?.length || 0;
  const followers = profile?.followers || 0;
  if (n >= 12 || totalStars >= 500 || followers >= 150) return { verdict: 'strong', note: 'Senior claim matches a deep public footprint', value: 1 };
  if (n >= 5 || totalStars >= 100) return { verdict: 'partial', note: 'Moderate footprint for a senior role', value: 0.6 };
  return { verdict: 'weak', note: 'Senior title with a thin public footprint', value: 0.25 };
};

const companyAnalysis = (job, profile) => {
  const gh = (profile?.company || '').replace(/^@/, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const claim = (job.company || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!gh) return { verdict: 'na', note: 'No company listed on GitHub', value: 0.5 };
  if (claim && (gh.includes(claim) || claim.includes(gh))) return { verdict: 'strong', note: 'Company matches GitHub profile', value: 1 };
  return { verdict: 'conflict', note: `GitHub profile lists "${profile.company}"`, value: 0.15 };
};

const analyzeJob = (job, profile, repos, languages) => {
  const stack = stackAnalysis(`${job.title} ${job.description}`, languages);
  const win = windowAnalysis(job, repos);
  const senior = seniorityAnalysis(job, profile, repos);
  const company = companyAnalysis(job, profile);

  const score = Math.round(
    100 * (
      W.stack * SCORE_WEIGHT[stack.verdict] +
      W.window * SCORE_WEIGHT[win.verdict] +
      W.seniority * SCORE_WEIGHT[senior.verdict] +
      W.company * SCORE_WEIGHT[company.verdict]
    )
  );

  const anyConflict = [stack, win, senior, company].some((s) => s.verdict === 'conflict');
  const overall = anyConflict ? 'conflict' : score >= 80 ? 'strong' : score >= 55 ? 'partial' : 'none';

  return { job, stack, win, senior, company, score, overall };
};

/* ═══════════ UI ═══════════ */

const VerdictPill = ({ verdict }) => {
  const meta = VERDICT_META[verdict] || VERDICT_META.na;
  return (
    <span className="rr-pill" style={{ color: meta.color, background: meta.bg, borderColor: `${meta.color}40` }}>
      {verdict === 'conflict' ? <AlertTriangle size={12} /> : verdict === 'strong' ? <Check size={12} /> : <Minus size={12} />}
      {meta.label}
    </span>
  );
};

const SignalRow = ({ icon: Icon, label, note, value, color }) => (
  <div className="rr-signal">
    <span className="rr-signal-icon" style={{ color }}><Icon size={16} /></span>
    <div className="rr-signal-body">
      <div className="rr-signal-head">
        <b>{label}</b>
        <span style={{ color }}>{note}</span>
      </div>
      <div className="rr-signal-track">
        <span className="rr-signal-fill" style={{ width: `${Math.max(4, Math.round(value * 100))}%`, background: color }} />
      </div>
    </div>
  </div>
);

const signalValue = (sig) => {
  const v = sig.verdict;
  if (v === 'strong') return 1;
  if (v === 'partial') return 0.55;
  if (v === 'weak') return 0.3;
  if (v === 'none') return 0.35;
  if (v === 'conflict') return 0.12;
  return 0.5;
};

const ResumeReality = ({ username, profile, repos, stats, linkedinData, onLinkedinData }) => {
  const fileRef = useRef(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const languages = useMemo(() => stats?.languages || [], [stats]);

  const analysis = useMemo(() => {
    if (!linkedinData || linkedinData.length === 0) return null;
    return linkedinData.map((job) => analyzeJob(job, profile, repos, languages));
  }, [linkedinData, profile, repos, languages]);

  const overallScore = useMemo(() => {
    if (!analysis || analysis.length === 0) return 0;
    return Math.round(analysis.reduce((s, a) => s + a.score, 0) / analysis.length);
  }, [analysis]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseLinkedInCSV(event.target.result);
        if (parsed.length === 0) {
          setUploadStatus('No positions found in that CSV');
          return;
        }
        onLinkedinData(parsed);
        setUploadStatus(`✓ ${parsed.length} roles attached from LinkedIn`);
      } catch (err) {
        setUploadStatus(err.message || 'Invalid LinkedIn CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!analysis) {
    return (
      <div className="rr-empty animate-fade-in">
        <div className="rr-empty-icon"><FileText size={30} /></div>
        <h3 className="rr-empty-title">Resume vs Reality</h3>
        <p className="rr-empty-desc">
          Upload a <b>LinkedIn Positions.csv</b> export to verify every career claim against {username ? `@${username}'s` : 'this profile\'s'} public GitHub history.
          We cross-check stacks, activity windows and seniority — with an evidence trail.
        </p>
        <label className={`rr-upload-btn ${uploadStatus.startsWith('✓') ? 'rr-upload-btn--ok' : ''}`}>
          <Upload size={16} />
          {uploadStatus.startsWith('✓') ? uploadStatus : uploadStatus || 'Upload LinkedIn Positions.csv'}
          <input ref={fileRef} type="file" accept=".csv" hidden onChange={handleUpload} />
        </label>
        {uploadStatus && !uploadStatus.startsWith('✓') && <p className="rr-upload-error">{uploadStatus}</p>}
      </div>
    );
  }

  const topSkills = languages.slice(0, 6).map((l) => l.name);

  return (
    <div className="rr-report animate-fade-in">
      {/* Header + overall score */}
      <div className="rr-hero">
        <div className="rr-score-wrap">
          <svg className="rr-ring" width="132" height="132" viewBox="0 0 132 132">
            <circle cx="66" cy="66" r="56" className="rr-ring-track" />
            <circle
              cx="66" cy="66" r="56"
              className="rr-ring-value"
              strokeDasharray={2 * Math.PI * 56}
              strokeDashoffset={2 * Math.PI * 56 * (1 - overallScore / 100)}
            />
          </svg>
          <div className="rr-score-label">
            <b>{overallScore}</b>
            <span>Reality Score</span>
          </div>
        </div>

        <div className="rr-hero-copy">
          <p className="rr-eyebrow">Resume vs Reality</p>
          <h3 className="rr-hero-title">
            {overallScore >= 80
              ? 'High credibility — claims align with public code'
              : overallScore >= 55
                ? 'Moderate — some claims lack public evidence'
                : 'Low public evidence — most claims are unverifiable'}
          </h3>
          <p className="rr-hero-desc">
            {analysis.length} career {analysis.length > 1 ? 'claims' : 'claim'} cross-checked against{' '}
            {repos?.length || 0} public repositories.
          </p>
          <div className="rr-skill-chips">
            {topSkills.map((s) => (
              <span key={s} className="rr-skill-chip">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Per-role verdicts */}
      <div className="rr-jobs">
        {analysis.map((a, i) => (
          <div key={`${a.job.company}-${i}`} className="rr-job">
            <div className="rr-job-head">
              <div className="rr-job-company">
                <span className="rr-job-icon"><Briefcase size={18} /></span>
                <div>
                  <h4 className="rr-job-title">{a.job.title}</h4>
                  <p className="rr-job-company-name">{a.job.company} · {a.job.startDate} — {a.job.endDate}</p>
                </div>
              </div>
              <div className="rr-job-verdict">
                <span className="rr-job-score" style={{ color: VERDICT_META[a.overall].color }}>{a.score}</span>
                <VerdictPill verdict={a.overall} />
              </div>
            </div>

            {a.job.description && <p className="rr-job-desc">{a.job.description}</p>}

            <div className="rr-signals">
              <SignalRow
                icon={Code2}
                label="Tech stack match"
                note={a.stack.note}
                value={signalValue(a.stack)}
                color={a.stack.verdict === 'conflict' ? '#f43f5e' : '#6366f1'}
              />
              <SignalRow
                icon={GitBranch}
                label="Activity in this period"
                note={a.win.note}
                value={a.win.ratio}
                color="#3b82f6"
              />
              <SignalRow
                icon={TrendingUp}
                label="Seniority signal"
                note={a.senior.note}
                value={a.senior.value}
                color="#8b5cf6"
              />
              <SignalRow
                icon={Building2}
                label="Employer match"
                note={a.company.note}
                value={a.company.value}
                color="#10b981"
              />
            </div>

            {/* Evidence repos */}
            {a.win.evidence.length > 0 && (
              <div className="rr-evidence">
                <p className="rr-evidence-label">Evidence in this period</p>
                <div className="rr-evidence-list">
                  {a.win.evidence.slice(0, 4).map((repo) => (
                    <a
                      key={repo.id}
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rr-evidence-item"
                    >
                      <GitBranch size={13} />
                      <span className="rr-evidence-name">{repo.name}</span>
                      <span className="rr-evidence-lang">{repo.language || '—'}</span>
                      <span className="rr-evidence-stars"><Star size={12} />{repo.stargazers_count || 0}</span>
                      <ExternalLink size={12} className="rr-evidence-link" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footnotes */}
      <div className="rr-footnote">
        <ShieldCheck size={16} />
        <div>
          <b>How this works</b>
          <p>
            Every signal uses only <b>public GitHub data</b>: repository languages, creation/push dates, and the profile's
            stated company. Absence of evidence is not proof — a developer may simply work in private repositories.
            Treat this as a screening tool, not a verdict.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResumeReality;
