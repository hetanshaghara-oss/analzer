import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserProfile, fetchUserRepositories, calculateStatistics } from '../services/github';
import { generateInterviewQuestions, scoreAnswer, calculateResults } from '../services/interviewEngine';
import RepoSelector from '../components/interview/RepoSelector';
import InterviewSession from '../components/interview/InterviewSession';
import InterviewResults from '../components/interview/InterviewResults';
import Skeleton from '../components/ui/Skeleton';
import { Bot, ArrowLeft, Sparkles } from 'lucide-react';
import './InterviewSimulator.css';

/* ══════════════════════════════════════
   InterviewSimulator — full-page route.
   3 steps: Select Repo → Take Interview → Results
══════════════════════════════════════ */

const InterviewSimulator = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repos, setRepos] = useState(null);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);

  // Interview state
  const [step, setStep] = useState('select'); // select | interview | results
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [context, setContext] = useState(null);
  const [results, setResults] = useState(null);
  const [overallScore, setOverallScore] = useState(0);
  const [categoryScores, setCategoryScores] = useState({});
  const [grade, setGrade] = useState(null);
  const [summary, setSummary] = useState('');
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [elapsed, setElapsed] = useState(0);

  // Load user data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = await fetchUserProfile(username);
        const repoData = await fetchUserRepositories(username);
        const statsData = calculateStatistics(repoData);
        setUserData(user);
        setRepos(repoData);
        setStats(statsData);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (username) load();
  }, [username]);

  // Start interview when repo is selected
  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    const { questions: qs, context: ctx } = generateInterviewQuestions(repo, userData, stats);
    setQuestions(qs);
    setContext(ctx);
    setStep('interview');
  };

  // Complete interview
  const handleInterviewComplete = (rawResults, timeElapsed) => {
    const scored = rawResults.map(r => ({
      ...scoreAnswer(r.answer, r.question),
      question: r.question,
      answer: r.answer,
    }));

    const res = calculateResults(scored);

    setResults(scored);
    setOverallScore(res.overallScore);
    setCategoryScores(res.categoryScores);
    setGrade(res.grade);
    setSummary(res.summary);
    setStrengths(res.strengths);
    setWeaknesses(res.weaknesses);
    setElapsed(timeElapsed);
    setStep('results');
  };

  // Retry
  const handleRetry = () => {
    setStep('select');
    setSelectedRepo(null);
    setResults(null);
    setQuestions([]);
  };

  if (loading) {
    return (
      <div className="app-page interview-page">
        <div className="interview-loading">
          <div className="container mt-12">
            <Skeleton variant="text" className="w-1/3 h-8 mb-6" />
            <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" className="h-40" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page interview-page">
        <div className="container mt-12 text-center">
          <div className="glass p-8 rounded-xl max-w-md mx-auto">
            <h2 className="text-danger mb-4 text-2xl font-bold">Failed to load profile</h2>
            <p className="text-secondary mb-6">{error}</p>
            <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page interview-page">
      <div className="interview-container animate-fade-in">
        {/* Top navigation */}
        <div className="interview-header">
          <button
            className="interview-back"
            onClick={() => step === 'select' ? navigate(`/dashboard/${username}`) : handleRetry()}
          >
            <ArrowLeft size={16} />
            {step === 'select' ? 'Back to Dashboard' : 'Start Over'}
          </button>

          <div className="interview-brand">
            <Bot size={20} />
            <span>AI Interview Simulator</span>
          </div>

          {step !== 'select' && (
            <div className="interview-repo-badge">
              <Sparkles size={14} />
              {selectedRepo?.name}
            </div>
          )}
        </div>

        {/* Step content */}
        {step === 'select' && (
          <RepoSelector repos={repos || []} onSelect={handleRepoSelect} />
        )}

        {step === 'interview' && questions.length > 0 && (
          <InterviewSession
            questions={questions}
            context={context}
            onComplete={handleInterviewComplete}
          />
        )}

        {step === 'results' && results && (
          <InterviewResults
            results={results}
            context={context}
            overallScore={overallScore}
            categoryScores={categoryScores}
            grade={grade}
            summary={summary}
            strengths={strengths}
            weaknesses={weaknesses}
            elapsed={elapsed}
            onRetry={handleRetry}
          />
        )}
      </div>
    </div>
  );
};

export default InterviewSimulator;
