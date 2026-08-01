import React from 'react';
import { ShieldCheck, Activity, Layers, Cpu, CheckCircle2 } from 'lucide-react';
import './AIComponents.css';

const MetricMeter = ({ icon: Icon, label, score, accent }) => (
  <div className="ai-meter">
    <div className="ai-meter-head">
      <div className={`ai-meter-icon ${accent}`}><Icon size={20} /></div>
      <div>
        <p className="ai-meter-label">{label}</p>
        <p className="ai-meter-value">{score}%</p>
      </div>
    </div>
    <div className="ai-meter-track">
      <div className="ai-meter-fill" style={{ width: `${score}%` }} />
    </div>
  </div>
);

const CodeHealthAudit = ({ codeHealth }) => {
  if (!codeHealth) return null;

  const { maintainabilityIndex, securityScore, architecturePatterns, stackBreakdown } = codeHealth;

  return (
    <div className="ai-card">
      <div className="ai-card-title">
        <span className="ai-title-emoji">⚡</span> AI Code Health &amp; Architecture Audit
        <span className="ai-card-badge">Automated Audit</span>
      </div>

      {/* Code Health & Security Metrics */}
      <div className="ai-metric-grid">
        <MetricMeter
          icon={Activity}
          label="Code Maintainability"
          score={maintainabilityIndex}
          accent=""
        />
        <MetricMeter
          icon={ShieldCheck}
          label="Security & License Score"
          score={securityScore}
          accent=""
        />
      </div>

      {/* Architecture Patterns Detected */}
      <div>
        <h4 className="ai-sub-head">
          <Layers size={16} /> Detected Architecture Patterns
        </h4>
        <div className="ai-chips">
          {architecturePatterns.map((pattern, idx) => (
            <div key={idx} className="ai-chip">
              <CheckCircle2 size={14} />
              {pattern}
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack Distribution Breakdown */}
      <div>
        <h4 className="ai-sub-head">
          <Cpu size={16} style={{ color: 'hsl(var(--color-purple))' }} /> Ecosystem Domain Breakdown
        </h4>
        <div className="ai-stack-grid">
          <div className="ai-stack-tile">
            <div className="ai-stack-tile-icon">🎨</div>
            <p className="ai-stack-tile-label">Frontend</p>
            <p className="ai-stack-tile-value">{stackBreakdown.frontend} Repos</p>
          </div>
          <div className="ai-stack-tile">
            <div className="ai-stack-tile-icon">⚙️</div>
            <p className="ai-stack-tile-label">Backend / API</p>
            <p className="ai-stack-tile-value">{stackBreakdown.backend} Repos</p>
          </div>
          <div className="ai-stack-tile">
            <div className="ai-stack-tile-icon">☁️</div>
            <p className="ai-stack-tile-label">DevOps / Cloud</p>
            <p className="ai-stack-tile-value">{stackBreakdown.devops} Repos</p>
          </div>
          <div className="ai-stack-tile">
            <div className="ai-stack-tile-icon">🗄️</div>
            <p className="ai-stack-tile-label">Database / Systems</p>
            <p className="ai-stack-tile-value">{stackBreakdown.database} Repos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeHealthAudit;
