import React from 'react';
import { User, Code, Award } from 'lucide-react';
import './AIComponents.css';

const SummaryItem = ({ icon: Icon, title, content }) => (
  <div className="ai-summary-item">
    <h4><Icon size={18} /> {title}</h4>
    <p>{content}</p>
  </div>
);

const AnalysisSummary = ({ summary }) => {
  return (
    <div className="ai-card">
      <h3 className="ai-card-title">
        <span className="ai-title-emoji">🤖</span> AI Profile Analysis
      </h3>
      <div className="ai-summary-list">
        <SummaryItem icon={User} title="Developer Overview" content={summary.overview} />
        <SummaryItem icon={Code} title="Coding Style Summary" content={summary.codingStyle} />
        <SummaryItem icon={Award} title="Repository Quality Summary" content={summary.quality} />
      </div>
    </div>
  );
};

export default AnalysisSummary;
