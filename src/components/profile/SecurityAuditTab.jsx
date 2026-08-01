import React from 'react';
import { analyzeSecurityProfile } from '../../services/securityAnalyzer';
import { ShieldCheck, ShieldAlert, AlertTriangle, FileText, Lock, Clock, CheckCircle2 } from 'lucide-react';
import './SecurityAudit.css';

const SecurityAuditTab = ({ repoData }) => {
  if (!repoData || repoData.length === 0) {
    return (
      <div className="sa-empty animate-fade-in">
        <ShieldAlert size={48} className="sa-empty-icon" />
        <h3>No Repositories Found</h3>
        <p>Unable to run security audit on empty profile.</p>
      </div>
    );
  }

  const audit = analyzeSecurityProfile(repoData);

  const scoreColor =
    audit.score >= 80 ? 'hsl(var(--color-green))'
    : audit.score >= 60 ? 'hsl(var(--accent-primary))'
    : audit.score >= 40 ? 'hsl(var(--color-yellow))'
    : 'hsl(var(--color-red))';

  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * Math.min(100, Math.max(0, audit.score))) / 100;

  const riskBg =
    audit.riskLevel === 'Low Risk' ? 'hsl(var(--color-green) / 0.12)'
    : audit.riskLevel === 'Medium Risk' ? 'hsl(var(--color-yellow) / 0.12)'
    : 'hsl(var(--color-red) / 0.12)';
  const riskFg =
    audit.riskLevel === 'Low Risk' ? 'hsl(var(--color-green))'
    : audit.riskLevel === 'Medium Risk' ? 'hsl(var(--color-yellow))'
    : 'hsl(var(--color-red))';

  return (
    <div className="sa-container animate-fade-in">

      {/* Header banner */}
      <div className="sa-header">
        <div className="sa-header-left">
          <div className="sa-shield-box"><ShieldCheck size={26} /></div>
          <div className="sa-header-text">
            <h2>
              Repository Security Audit
              <span className="sa-risk-badge" style={{ background: riskBg, color: riskFg, border: `1px solid ${riskFg}44` }}>
                <ShieldCheck size={12} /> {audit.riskLevel}
              </span>
            </h2>
            <p>Automated hygiene scan across {audit.totalScanned} public repositories.</p>
          </div>
        </div>
        <div className="sa-score-ring">
          <svg viewBox="0 0 70 70">
            <defs>
              <linearGradient id="sa-score-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={scoreColor} />
                <stop offset="100%" stopColor={scoreColor} stopOpacity="0.45" />
              </linearGradient>
            </defs>
            <circle cx="35" cy="35" r={r} fill="none" strokeWidth="6" stroke="hsl(var(--bg-secondary))" />
            <circle
              cx="35" cy="35" r={r}
              fill="none"
              stroke={`url(#sa-score-grad)`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 35 35)"
            />
          </svg>
          <div className="sa-score-label">
            <span className="sa-score-value">{audit.score}</span>
            <span className="sa-score-max">/ 100</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="sa-metrics">
        <div className="sa-metric">
          <div className="sa-metric-head">
            <span className="sa-metric-icon"><FileText size={18} /></span>
            <div>
              <div className="sa-metric-label">License Compliance</div>
              <div className="sa-metric-value">{audit.licenseComplianceRate}%</div>
              <div className="sa-metric-sub">{audit.missingLicenseRepos.length} missing licenses</div>
            </div>
          </div>
          <div className="sa-metric-track"><div className="sa-metric-fill" style={{ width: `${audit.licenseComplianceRate}%` }} /></div>
        </div>

        <div className="sa-metric">
          <div className="sa-metric-head">
            <span className="sa-metric-icon"><CheckCircle2 size={18} /></span>
            <div>
              <div className="sa-metric-label">Documentation Coverage</div>
              <div className="sa-metric-value">{audit.documentationRate}%</div>
              <div className="sa-metric-sub">Descriptions &amp; READMEs</div>
            </div>
          </div>
          <div className="sa-metric-track"><div className="sa-metric-fill" style={{ width: `${audit.documentationRate}%` }} /></div>
        </div>

        <div className="sa-metric">
          <div className="sa-metric-head">
            <span className="sa-metric-icon"><Clock size={18} /></span>
            <div>
              <div className="sa-metric-label">Repository Maintenance</div>
              <div className="sa-metric-value">{audit.activeReposCount} Active</div>
              <div className="sa-metric-sub">{audit.staleReposCount} unmaintained (&gt;1 yr)</div>
            </div>
          </div>
          <div className="sa-metric-track">
            <div
              className="sa-metric-fill"
              style={{
                width: `${audit.totalScanned ? (audit.activeReposCount / audit.totalScanned) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="sa-metric">
          <div className="sa-metric-head">
            <span className="sa-metric-icon"><Lock size={18} /></span>
            <div>
              <div className="sa-metric-label">Exposure Risk Flag</div>
              <div className="sa-metric-value">
                {audit.potentialRiskyRepos.length === 0 ? 'Clean' : `${audit.potentialRiskyRepos.length} Flagged`}
              </div>
              <div className="sa-metric-sub">Secret keyword scan</div>
            </div>
          </div>
          <div className="sa-metric-track">
            <div
              className="sa-metric-fill"
              style={{
                width: audit.potentialRiskyRepos.length === 0 ? '100%' : `${Math.max(10, 100 - audit.potentialRiskyRepos.length * 15)}%`,
                background: audit.potentialRiskyRepos.length === 0 ? 'hsl(var(--color-green))' : 'hsl(var(--color-orange))',
              }}
            />
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="sa-section-head">
        <AlertTriangle size={22} />
        Security Recommendations &amp; Remediation
      </div>

      <div className="sa-recs">
        {audit.recommendations.map((item, idx) => (
          <div key={idx} className="sa-rec">
            <span className={`sa-severity ${
              item.severity === 'High' ? 'sa-severity-high'
              : item.severity === 'Medium' ? 'sa-severity-medium'
              : 'sa-severity-low'
            }`}>
              {item.severity}
            </span>
            <div className="sa-rec-body">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="sa-section-head" style={{ marginTop: '0.5rem' }}>
        <FileText size={22} />
        Audited Repositories Summary
      </div>

      <div className="sa-table-wrap" style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid hsl(var(--border-color))',
        background: 'hsl(var(--card-bg))',
      }}>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Repository</th>
              <th>License</th>
              <th>Last Updated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {repoData.slice(0, 10).map((r, idx) => {
              const isStale = new Date(r.updated_at) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
              return (
                <tr key={idx}>
                  <td className="repo-name">{r.name}</td>
                  <td>
                    {r.license ? (
                      <span className="license-badge license-ok">{r.license.spdx_id || r.license.name || 'Licensed'}</span>
                    ) : (
                      <span className="license-badge license-miss">No License</span>
                    )}
                  </td>
                  <td style={{ color: 'hsl(var(--text-secondary))' }}>
                    {new Date(r.updated_at).toLocaleDateString()}
                  </td>
                  <td className={isStale ? 'status-inactive' : 'status-active'}>
                    {isStale ? 'Inactive' : 'Active'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default SecurityAuditTab;
