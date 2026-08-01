import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { fetchUserProfile, fetchUserRepositories, fetchUserEvents, calculateStatistics, analyzePersona } from '../services/github';
import ProfileHeader from '../components/profile/ProfileHeader';
import DashboardTabs from '../components/dashboard/DashboardTabs';
import QuickStats from '../components/dashboard/QuickStats';
import HighlightCards from '../components/dashboard/HighlightCards';
import LanguagePieChart from '../components/charts/LanguagePieChart';
import RepoBarChart from '../components/charts/RepoBarChart';
import ActivityTimeline from '../components/charts/ActivityTimeline';
import RepoList from '../components/profile/RepoList';
import Skeleton from '../components/ui/Skeleton';
import AIReportTab from '../components/ai/AIReportTab';
import ExportShareTab from '../components/profile/ExportShareTab';
import SecurityAuditTab from '../components/profile/SecurityAuditTab';
import CommitHeatmapTab from '../components/profile/CommitHeatmapTab';
import ImpactGlobe from '../components/charts/ImpactGlobe';
import TimeMachine from '../components/charts/TimeMachine';
import SkillTree from '../components/charts/SkillTree';
import StreakTracker from '../components/charts/StreakTracker';
import CareerJourney from '../components/profile/CareerJourney';
import ResumeReality from '../components/profile/ResumeReality';
import DNAReport from '../components/profile/DNAReport';
import AIAgents from '../components/dashboard/AIAgents';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import TiltCard from '../components/ui/TiltCard';
import { Sparkles, ArrowRight, Bot, Target } from 'lucide-react';

const DashboardSkeleton = () => (
  <div className="container mt-8 animate-fade-in">
    <div className="flex flex-col sm-flex-row gap-6 mb-8">
      <Skeleton variant="circular" className="w-[120px] h-[120px] shrink-0" />
      <div className="flex-1 w-full mt-2">
        <Skeleton variant="text" className="w-1/3 h-8 mb-4" />
        <Skeleton variant="text" className="w-1/4 h-5 mb-6" />
        <Skeleton variant="text" className="w-2/3 h-4" />
        <Skeleton variant="text" className="w-1/2 h-4" />
      </div>
    </div>
    
    <div className="flex gap-4 mb-8">
      <Skeleton variant="rectangular" className="w-32 h-10" />
      <Skeleton variant="rectangular" className="w-40 h-10" />
      <Skeleton variant="rectangular" className="w-32 h-10" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" className="h-28" />
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const { username } = useParams();
  const location = useLocation();
  const [linkedinData, setLinkedinData] = useState(location.state?.linkedinData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [repoData, setRepoData] = useState([]);
  const [stats, setStats] = useState(null);
  const [persona, setPersona] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await fetchUserProfile(username);
        const repos = await fetchUserRepositories(username);
        
        let events = [];
        try {
          events = await fetchUserEvents(username);
        } catch (e) {
          console.warn("Could not fetch events, skipping persona time analysis:", e);
        }
        
        const calculatedStats = calculateStatistics(repos);
        const aiPersona = analyzePersona(repos, events);
        
        setUserData(user);
        setRepoData(repos);
        setStats(calculatedStats);
        setPersona(aiPersona);
        setEventsData(events);
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadData();
    }
  }, [username]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="container mt-8 text-center animate-fade-in">
        <div className="glass p-8 rounded-xl max-w-md mx-auto">
          <h2 className="text-danger mb-4 text-2xl font-bold">Oops!</h2>
          <p className="text-secondary mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-accent-primary text-white px-6 py-2 rounded-full hover:bg-accent-hover transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!userData || !stats) return null;

  return (
    <div className="app-page dashboard-page container mt-8 mb-12 animate-fade-in">
      <div className="stagger-1">
        <ProfileHeader user={userData} />

        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Link to={`/wrapped/${username}`} className="wrapped-pill">
            <Sparkles size={16} />
            View {new Date().getFullYear()} Wrapped
            <ArrowRight size={15} />
          </Link>
          <Link to={`/interview/${username}`} className="wrapped-pill" style={{ background: 'linear-gradient(135deg, hsl(231 97% 62%), hsl(270 80% 65%))' }}>
            <Bot size={16} />
            AI Interview Simulator
            <ArrowRight size={15} />
          </Link>
          <Link to={`/match/${username}`} className="wrapped-pill" style={{ background: 'linear-gradient(135deg, hsl(160 84% 39%), hsl(199 89% 48%))' }}>
            <Target size={16} />
            Match to a Job
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {persona && (
        <div className="stagger-2 mt-6">
          <TiltCard maxTilt={10}>
            <div className="persona-card">
              <div className="persona-icon-wrap">
                {persona.icon === "Code" && <span className="text-3xl">💻</span>}
                {persona.icon === "Layout" && <span className="text-3xl">🎨</span>}
                {persona.icon === "Server" && <span className="text-3xl">⚙️</span>}
                {persona.icon === "Database" && <span className="text-3xl">📊</span>}
                {persona.icon === "Cpu" && <span className="text-3xl">🛠️</span>}
                {persona.icon === "Globe" && <span className="text-3xl">🌍</span>}
                {persona.icon === "Ghost" && <span className="text-3xl">👻</span>}
              </div>
              <div className="persona-content">
                <h3 className="persona-title text-gradient">{persona.title}</h3>
                <p className="persona-summary">{persona.summary}</p>
              </div>
            </div>
          </TiltCard>
        </div>
      )}

      <div className="mt-8 stagger-3">
        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} hasLinkedin={!!linkedinData} />
      </div>

      <div className="tab-content animate-slide-up">
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div>
              <StreakTracker events={eventsData} repos={repoData} />
            </div>

            <div>
              <div className="section-heading">
                <span className="section-eyebrow">Performance</span>
                <h3 className="section-title">At a glance</h3>
              </div>
              <QuickStats stats={stats.overview} />
            </div>

            <div>
              <div className="section-heading">
                <span className="section-eyebrow">Standouts</span>
                <h3 className="section-title">Repository highlights</h3>
              </div>
              <HighlightCards highlights={stats.highlights} />
            </div>

            <div>
              <div className="section-heading">
                <span className="section-eyebrow">Global impact</span>
                <h3 className="section-title">Reach around the world</h3>
              </div>
              <ImpactGlobe username={username} />
            </div>

            <div>
              <div className="section-heading">
                <span className="section-eyebrow">Tech mix</span>
                <h3 className="section-title">Languages & top repositories</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LanguagePieChart data={stats.languages} />
                <RepoBarChart repos={repoData} metric="stars" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityTimeline repos={repoData} />
              <LanguagePieChart data={stats.languages} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RepoBarChart repos={repoData} metric="stars" />
              <RepoBarChart repos={repoData} metric="forks" />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <RepoBarChart repos={repoData} metric="size" />
            </div>
          </div>
        )}

        {activeTab === 'repositories' && (
          <div>
            <RepoList repos={repoData} availableLanguages={stats.languages} />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="animate-slide-up">
            <TimeMachine repos={repoData} />
          </div>
        )}

        {activeTab === 'skill-tree' && (
          <SkillTree repos={repoData} />
        )}

        {activeTab === 'career-journey' && (
          <CareerJourney repos={repoData} linkedinData={linkedinData} />
        )}

        {activeTab === 'resume-reality' && (
          <ResumeReality
            username={username}
            profile={userData}
            repos={repoData}
            stats={stats}
            linkedinData={linkedinData}
            onLinkedinData={setLinkedinData}
          />
        )}

        {activeTab === 'dna-report' && (
          <DNAReport userData={userData} repos={repoData} events={eventsData} />
        )}

        {activeTab === 'ai-report' && (
          <AIReportTab userData={userData} stats={stats} repos={repoData} />
        )}

        {activeTab === 'commit-rhythm' && (
          <CommitHeatmapTab repoData={repoData} username={username} />
        )}

        {activeTab === 'security-audit' && (
          <SecurityAuditTab repoData={repoData} />
        )}

        {activeTab === 'export-share' && (
          <ExportShareTab userData={userData} stats={stats} />
        )}
      </div>

      {/* AI Agents — README generator · Profile Roast · Badge generator */}
      <ErrorBoundary>
        <AIAgents profile={userData} stats={stats} repos={repoData} />
      </ErrorBoundary>
    </div>
  );
};

export default Dashboard;
