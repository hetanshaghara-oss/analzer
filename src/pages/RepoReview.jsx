import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRepoDetail, fetchRepoFileTree, fetchRepoReadme, fetchRepoLanguages, fetchRepoContributors } from '../services/github';
import { generateRepoReport } from '../services/repoAnalyzer';
import RepoOverviewCard from '../components/review/RepoOverviewCard';
import RepoScoreCard from '../components/review/RepoScoreCard';
import ReadmeAnalysis from '../components/review/ReadmeAnalysis';
import StructureAnalysis from '../components/review/StructureAnalysis';
import SecurityPanel from '../components/review/SecurityPanel';
import PerformancePanel from '../components/review/PerformancePanel';
import RecommendationsList from '../components/review/RecommendationsList';
import FinalVerdict from '../components/review/FinalVerdict';
import RepoChat from '../components/review/RepoChat';
import Paywall from '../components/auth/Paywall';
import ErrorBoundary from '../components/ui/ErrorBoundary';

const loadingSteps = [
  'Fetching repository metadata...',
  'Scanning file structure...',
  'Reading README content...',
  'Analyzing language breakdown...',
  'Running security checks...',
  'Generating AI review...',
];

const ReviewLoadingScreen = () => {
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStepIdx(p => (p + 1) % loadingSteps.length), 600);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="ai-loading-screen animate-fade-in container mt-16">
      <div className="text-center">
        <div className="text-6xl mb-6 animate-pulse-slow">🤖</div>
        <h3 className="text-2xl font-bold mb-2">AI is Reviewing the Repository...</h3>
        <p className="text-secondary mb-8">{loadingSteps[stepIdx]}</p>
        <div className="ai-scan-line mx-auto" />
      </div>
    </div>
  );
};

const RepoReview = () => {
  const { username, repo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [repoData, setRepoData] = useState(null);

  useEffect(() => {
    const loadAndAnalyze = async () => {
      setLoading(true);
      setError(null);
      try {
        const [detail, fileTree, readmeContent, languages, contributors] = await Promise.all([
          fetchRepoDetail(username, repo),
          fetchRepoFileTree(username, repo),
          fetchRepoReadme(username, repo),
          fetchRepoLanguages(username, repo),
          fetchRepoContributors(username, repo),
        ]);

        setRepoData(detail);

        // Simulate AI processing time
        await new Promise(r => setTimeout(r, 2000));

        const generatedReport = generateRepoReport(detail, fileTree, readmeContent, languages, contributors);
        setReport(generatedReport);
      } catch (err) {
        setError(err.message || 'Failed to analyze repository.');
      } finally {
        setLoading(false);
      }
    };

    if (username && repo) loadAndAnalyze();
  }, [username, repo]);

  if (loading) return <ReviewLoadingScreen />;

  if (error) {
    return (
      <div className="container mt-8 text-center animate-fade-in">
        <div className="glass p-8 rounded-xl max-w-md mx-auto">
          <h2 className="text-danger mb-4 text-2xl font-bold">Review Failed</h2>
          <p className="text-secondary mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!report || !repoData) return null;

  return (
    <div className="app-page">
    <div className="container mt-8 mb-16 animate-fade-in" id="review-report">
      {/* Breadcrumb + header */}
      <div className="review-header">
        <nav className="review-breadcrumb">
          <button onClick={() => navigate(`/dashboard/${username}`)}>
            <span className="review-breadcrumb-user">{username}</span>
          </button>
          <span className="review-breadcrumb-sep">/</span>
          <span className="review-breadcrumb-repo">{repo}</span>
          <span className="review-badge">AI Review</span>
        </nav>
        <span className="section-eyebrow">Deep repository analysis</span>
        <h1 className="review-title">{repo}</h1>
      </div>

      <div className="space-y-6">
        {/* Overview */}
        <RepoOverviewCard repoData={repoData} summary={report.summary} />

        {/* Ask the AI anything about this repo — Pro-only */}
        <Paywall
          required="pro"
          title="GitInsight AI Chat"
          message="Ask any question about this repository with GitInsight AI — a Pro feature."
        >
          <ErrorBoundary>
            <RepoChat owner={username} repo={repo} />
          </ErrorBoundary>
        </Paywall>

        {/* Score + README side by side */}
        <div className="grid grid-cols-1 lg-grid-cols-2 gap-6">
          <RepoScoreCard scores={report.scores} />
          <ReadmeAnalysis readmeAnalysis={report.readmeAnalysis} />
        </div>

        {/* Structure + Security */}
        <div className="grid grid-cols-1 lg-grid-cols-2 gap-6">
          <StructureAnalysis structureAnalysis={report.structureAnalysis} />
          <SecurityPanel securityFlags={report.securityFlags} />
        </div>

        {/* Performance */}
        <PerformancePanel performanceInsights={report.performanceInsights} />

        {/* Strengths, Weaknesses, Recommendations */}
        <RecommendationsList
          strengths={report.strengths}
          weaknesses={report.weaknesses}
          recommendations={report.recommendations}
        />

        {/* Final Verdict */}
        <FinalVerdict verdict={report.finalVerdict} repoData={repoData} username={username} />
      </div>
    </div>
    </div>
  );
};

export default RepoReview;
