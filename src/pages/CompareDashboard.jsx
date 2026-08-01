import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchUserProfile, fetchUserRepos } from '../services/github';
import { generateComparisonReport } from '../services/comparisonAnalyzer';
import CompareSelector from '../components/compare/CompareSelector';
import TiltCard from '../components/ui/TiltCard';
import SpotlightCard from '../components/ui/SpotlightCard';
import { Loader2, Crown, Sparkles, Swords, UserX } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './CompareDashboard.css';

const CompareDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userParam = searchParams.get('users');

  const [selectedUsers, setSelectedUsers] = useState(userParam ? userParam.split(',') : []);
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [error, setError] = useState(null);

  const handleAddUser = (user) => setSelectedUsers(prev => [...prev, user]);
  const handleRemoveUser = (user) => setSelectedUsers(prev => prev.filter(u => u !== user));
  const handleCompare = () => navigate(`/compare?users=${selectedUsers.join(',')}`);

  useEffect(() => {
    if (!userParam) {
      setComparisonData(null);
      return;
    }
    const usersToFetch = userParam.split(',');
    if (usersToFetch.length < 2) return;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(usersToFetch.map(async (username) => {
          const profile = await fetchUserProfile(username);
          const repos = await fetchUserRepos(username);
          const events = []; // skipping events to save rate limits

          let languageStats = {};
          repos.forEach(repo => {
            if (repo.language) {
              languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
            }
          });
          return { profile, repos, events, stats: { languages: languageStats } };
        }));

        const report = generateComparisonReport(results);
        setComparisonData({ profiles: results, report });
      } catch (err) {
        setError(err.message || 'Failed to fetch comparison data');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [userParam]);

  if (!userParam) {
    return (
      <div className="app-page">
        <div className="container py-10">
          <CompareSelector selectedUsers={selectedUsers} onAddUser={handleAddUser} onRemoveUser={handleRemoveUser} onCompare={handleCompare} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-page">
        <div className="arena-loading">
          <Loader2 className="arena-loading-spinner" size={56} />
          <h2 className="arena-loading-title">Simulating battle…</h2>
          <p className="arena-loading-sub">Analyzing combatants: {selectedUsers.join(' vs ')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page">
        <div className="arena-error">
          <h2>Simulation failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/compare')} className="btn-primary">Return to Arena</button>
        </div>
      </div>
    );
  }

  if (!comparisonData) return null;

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];
  const { profiles, report } = comparisonData;

  const maxFollowers = Math.max(...profiles.map(p => p.profile.followers));
  const maxRepos = Math.max(...profiles.map(p => p.profile.public_repos));
  const maxScore = Math.max(...report.scores.map(s => s.overall));

  const radarData = [
    { subject: 'Technical', fullMark: 100 },
    { subject: 'Quality', fullMark: 100 },
    { subject: 'Open Source', fullMark: 100 },
    { subject: 'Docs', fullMark: 100 },
    { subject: 'Overall', fullMark: 100 },
  ];
  radarData.forEach((item, index) => {
    profiles.forEach((pd, pIdx) => {
      let val = 0;
      if (index === 0) val = report.scores[pIdx].technicalSkills;
      if (index === 1) val = report.scores[pIdx].repoQuality;
      if (index === 2) val = report.scores[pIdx].openSource;
      if (index === 3) val = report.scores[pIdx].documentation;
      if (index === 4) val = report.scores[pIdx].overall;
      item[pd.profile.login] = val;
    });
  });

  const barData = profiles.map(pd => ({
    name: pd.profile.login,
    followers: pd.profile.followers,
    repos: pd.profile.public_repos,
  }));

  const tooltipStyle = { background: '#fff', border: '1px solid hsl(220 13% 91%)', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 30px -12px rgba(15,23,42,0.3)' };

  return (
    <div className="app-page compare-arena container py-12 animate-fade-in">
      {/* Header */}
      <div className="arena-header">
        <div>
          <span className="section-eyebrow">Head-to-head showdown</span>
          <h1 className="arena-title">Battle <span className="text-gradient">Arena</span></h1>
          <p className="arena-subtitle">Two developers enter. One GitInsight Score leaves.</p>
        </div>
        <button onClick={() => navigate('/compare')} className="arena-select-btn">
          <Swords size={16} /> Select new challengers
        </button>
      </div>

      {/* Versus cards */}
      <div className="vs-grid">
        {profiles.length === 2 && (
          <div className="vs-badge">
            <span>VS</span>
          </div>
        )}

        {profiles.map((pd, i) => (
          <TiltCard key={pd.profile.login} maxTilt={5} scale={1.02} className="vs-card-tilt">
            <div className="vs-card" style={{ '--theme-color': COLORS[i] }}>
              <div className="vs-card-glow" />
              <div className="vs-card-content">
                <div className="vs-avatar-ring" style={{ borderColor: COLORS[i] }}>
                  <img src={pd.profile.avatar_url} alt={pd.profile.login} className="vs-avatar" />
                </div>
                <h3 className="vs-name">{pd.profile.name || pd.profile.login}</h3>
                <p className="vs-handle">@{pd.profile.login}</p>

                <div className="vs-stats">
                  <div className="vs-stat-row">
                    <span className="vs-stat-label">Overall score</span>
                    <span className="vs-stat-value" style={{ color: COLORS[i] }}>
                      {report.scores[i].overall}
                      {report.scores[i].overall === maxScore && <Crown size={20} className="vs-crown" />}
                    </span>
                  </div>
                  <div className="vs-stat-row">
                    <span className="vs-stat-label">Followers</span>
                    <span className="vs-stat-value">
                      {pd.profile.followers.toLocaleString()}
                      {pd.profile.followers === maxFollowers && pd.profile.followers > 0 && <Crown size={16} className="vs-crown vs-crown--small" />}
                    </span>
                  </div>
                  <div className="vs-stat-row">
                    <span className="vs-stat-label">Repositories</span>
                    <span className="vs-stat-value">
                      {pd.profile.public_repos.toLocaleString()}
                      {pd.profile.public_repos === maxRepos && pd.profile.public_repos > 0 && <Crown size={16} className="vs-crown vs-crown--small" />}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>

      {/* AI Verdict */}
      <SpotlightCard className="arena-verdict">
        <div className="arena-verdict-head">
          <Sparkles size={20} />
          <h2>AI Verdict</h2>
        </div>
        <p className="arena-verdict-text">{report.insights.summary}</p>
      </SpotlightCard>

      {/* Charts */}
      <div className="arena-charts">
        <SpotlightCard className="arena-chart-card">
          <h3 className="arena-chart-title">Combat radar</h3>
          <div className="arena-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(100,116,139,0.25)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(222,47%,40%)', fontSize: 13, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ paddingTop: '18px', fontSize: '13px' }} />
                {profiles.map((pd, i) => (
                  <Radar key={pd.profile.login} name={pd.profile.login} dataKey={pd.profile.login} stroke={COLORS[i]} strokeWidth={3} fill={COLORS[i]} fillOpacity={0.28} />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>

        <SpotlightCard className="arena-chart-card">
          <h3 className="arena-chart-title">Stats comparison</h3>
          <div className="arena-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(222,47%,40%)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(222,47%,40%)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(100,116,139,0.08)' }} contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="followers" name="Followers" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
                <Bar dataKey="repos" name="Repositories" fill={COLORS[1]} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>
      </div>

      {/* Shared tech */}
      <SpotlightCard className="arena-shared">
        <h2 className="arena-shared-title"><Swords size={24} /> Shared battlefield</h2>
        {report.skills.common.length > 0 ? (
          <div className="arena-pills">
            {report.skills.common.map(lang => (
              <span key={lang} className="skill-pill">{lang}</span>
            ))}
          </div>
        ) : (
          <div className="arena-pills-empty">
            <UserX size={22} />
            <p>No overlapping technologies detected. They fight on different fronts.</p>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
};

export default CompareDashboard;
