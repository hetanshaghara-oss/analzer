import React from 'react';
import './DashboardTabs.css';

const DashboardTabs = ({ activeTab, setActiveTab, hasLinkedin }) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics & Charts' },
    { id: 'repositories', label: 'Repositories' },
    { id: 'ai-report', label: '🤖 AI Report' },
    { id: 'resume-reality', label: '🧾 Resume vs Reality' },
    { id: 'skill-tree', label: '🌳 Skill Tree' },
    { id: 'dna-report', label: '🧬 DNA Report' },
    ...(hasLinkedin ? [{ id: 'career-journey', label: '👔 Career Journey' }] : []),
    { id: 'timeline', label: '⏱️ Timeline' },
    { id: 'commit-rhythm', label: '📅 Commit Rhythm' },
    { id: 'security-audit', label: '🛡️ Security Audit' },
    { id: 'export-share', label: '📤 Export & Share' },
  ];

  return (
    <div className="dashboard-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default DashboardTabs;
