import React, { useState, useEffect } from 'react';
import { generateAIReport } from '../../services/aiAnalyzer';
import { Sparkles, TrendingUp, Layers, Trophy } from 'lucide-react';
import DeveloperScoreCard from './DeveloperScoreCard';
import CodeHealthAudit from './CodeHealthAudit';
import AnalysisSummary from './AnalysisSummary';
import StrengthsWeaknesses from './StrengthsWeaknesses';
import CareerRoadmap from './CareerRoadmap';
import SuggestionsList from './SuggestionsList';
import './AIComponents.css';

const loadingSteps = [
  'Scanning GitHub repository metadata...',
  'Auditing code health & security licenses...',
  'Detecting architecture patterns...',
  'Evaluating 8-axis skill radar...',
  'Generating career roadmap & recommendations...',
  'Preparing AI Insights dashboard...',
];

const AILoadingScreen = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % loadingSteps.length);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ai-loading-screen animate-fade-in">
      <div className="ai-loading-emoji">🤖</div>
      <div>
        <h3 className="ai-loading-title">AI is Auditing Profile...</h3>
        <p className="ai-loading-step">{loadingSteps[stepIndex]}</p>
      </div>
      <div className="ai-scan-line" />
    </div>
  );
};

const InsightBadge = ({ icon: Icon, label, value, type }) => (
  <div className={`ai-insight ${type}`}>
    <div className="ai-insight-icon"><Icon size={20} /></div>
    <div>
      <p className="ai-insight-label">{label}</p>
      <p className="ai-insight-value">{value}</p>
    </div>
  </div>
);

const AIReportTab = ({ userData, stats, repos }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const aiReport = generateAIReport(userData, stats, repos);
      setReport(aiReport);
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [userData, stats, repos]);

  if (loading) return <AILoadingScreen />;
  if (!report) return null;

  return (
    <div className="ai-container animate-fade-in">

      {/* AI Insights Quick Badges */}
      <div>
        <h3 className="ai-section-head">
          <span className="ai-head-emoji">📈</span> Profile Highlights
        </h3>
        <div className="ai-insights">
          <InsightBadge icon={Sparkles} label="Top Skill" value={report.insights.mostProductive} />
          <InsightBadge icon={TrendingUp} label="Repo Trend" value={report.insights.repoTrend} />
          <InsightBadge icon={Layers} label="Tech Diversity" value={report.insights.techDiversity} />
          <InsightBadge icon={Trophy} label="Portfolio Tier" value={report.insights.completeness} />
        </div>
      </div>

      {/* 8-Axis Skill Radar + Code Health Audit Row */}
      <div className="ai-row">
        <DeveloperScoreCard scores={report.scores} />
        <CodeHealthAudit codeHealth={report.codeHealth} />
      </div>

      {/* Summary Row */}
      <AnalysisSummary summary={report.summary} />

      {/* Strengths and Weaknesses */}
      <StrengthsWeaknesses strengths={report.strengths} weaknesses={report.weaknesses} />

      {/* Roadmap + Suggestions Row */}
      <div className="ai-row">
        <CareerRoadmap roadmap={report.roadmap} />
        <SuggestionsList suggestions={report.suggestions} />
      </div>
    </div>
  );
};

export default AIReportTab;
