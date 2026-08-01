import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchUserProfile, fetchUserRepositories, calculateStatistics } from '../services/github';
import { generateInitialBuilderState } from '../services/builderEngine';
import SettingsPanel from '../components/builder/SettingsPanel';
import PortfolioTemplate from '../components/builder/PortfolioTemplate';
import ResumeTemplate from '../components/builder/ResumeTemplate';
import ExportManager from '../components/builder/ExportManager';
import Skeleton from '../components/ui/Skeleton';
import '../components/builder/BuilderStyles.css';

const BuilderSkeleton = () => (
  <div className="app-page">
    <div className="builder-workspace-container animate-fade-in">
      <div className="builder-settings-panel p-6 space-y-6">
        <Skeleton variant="text" className="w-1/2 h-8" />
        <Skeleton variant="rectangular" className="h-40" />
        <Skeleton variant="text" className="w-2/3 h-5" />
        <Skeleton variant="rectangular" className="h-32" />
      </div>
      <div className="builder-preview-panel">
        <div className="builder-preview-header justify-between">
          <Skeleton variant="rectangular" className="w-48 h-8 rounded-full" />
          <Skeleton variant="rectangular" className="w-32 h-8 rounded-full" />
        </div>
        <div className="builder-preview-scroll-area p-8">
          <Skeleton variant="rectangular" className="h-full" />
        </div>
      </div>
    </div>
  </div>
);

const StudioBuilder = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [tailoredJob, setTailoredJob] = useState(null);
  const [viewMode, setViewMode] = useState('portfolio'); // portfolio or resume
  const [activeTheme, setActiveTheme] = useState('theme-sleek-dark');
  const [activeFont, setActiveFont] = useState('font-sans');

  const loadFromGitHub = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await fetchUserProfile(username);
      const repos = await fetchUserRepositories(username);
      const stats = calculateStatistics(repos);

      setData(generateInitialBuilderState(user, stats, repos));
      setTailoredJob(null);
    } catch (err) {
      setError(err.message || 'An error occurred while building');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tailored = location.state?.tailored;
    if (tailored) {
      // Opened from Job Match Studio — use the tailored builder state.
      setData(tailored);
      setTailoredJob(location.state.jobTitle || 'Target Role');
      setLoading(false);
    } else if (username) {
      loadFromGitHub();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (loading) return <BuilderSkeleton />;

  if (error) {
    return (
      <div className="app-page">
        <div className="container mt-8 text-center animate-fade-in">
          <div className="glass p-8 rounded-xl max-w-md mx-auto">
            <h2 className="text-danger mb-4 text-2xl font-bold">Failed to load builder</h2>
            <p className="text-secondary mb-6">{error}</p>
            <button onClick={() => navigate(-1)} className="btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="app-page">
    {tailoredJob && (
      <div className="flex items-center justify-between gap-3 mb-4 p-4 rounded-xl mx-auto max-w-[1400px] print-hide" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <div className="flex items-center gap-2 text-sm">
          <span aria-hidden>✂️</span>
          <span className="text-secondary">Tailored for:</span>
          <span className="font-bold text-accent-primary">{tailoredJob}</span>
          <span className="text-muted hidden sm:inline">— skills, summary &amp; projects re-ranked for this role.</span>
        </div>
        <button onClick={loadFromGitHub} className="chip hover-accent shrink-0" title="Reload original GitHub-derived data">
          Reset to original
        </button>
      </div>
    )}
    <div className="builder-workspace-container animate-fade-in">
      {/* Settings control panel */}
      <SettingsPanel 
        data={data}
        setData={setData}
        activeTheme={activeTheme}
        setActiveTheme={setActiveTheme}
        activeFont={activeFont}
        setActiveFont={setActiveFont}
      />

      {/* Live Preview Panel */}
      <div className="builder-preview-panel">
        <div className="builder-preview-header print-hide">
          {/* Back to dashboard breadcrumb */}
          <button 
            onClick={() => navigate(`/dashboard/${username}`)}
            className="hover-accent font-semibold text-sm"
          >
            ← Back to Dashboard
          </button>

          {/* Toggle switcher */}
          <div className="preview-type-toggle">
            <button 
              onClick={() => setViewMode('portfolio')}
              className={`toggle-button ${viewMode === 'portfolio' ? 'active' : ''}`}
            >
              🌐 Live Portfolio
            </button>
            <button 
              onClick={() => setViewMode('resume')}
              className={`toggle-button ${viewMode === 'resume' ? 'active' : ''}`}
            >
              📄 ATS Resume
            </button>
          </div>

          {/* Download trigger */}
          <ExportManager 
            data={data}
            themeClass={activeTheme}
            viewMode={viewMode}
          />
        </div>

        {/* Dynamic preview content */}
        <div className={`builder-preview-scroll-area ${activeFont}`}>
          {viewMode === 'portfolio' ? (
            <PortfolioTemplate data={data} themeClass={activeTheme} />
          ) : (
            <ResumeTemplate data={data} />
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default StudioBuilder;
