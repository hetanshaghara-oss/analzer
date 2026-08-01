import React from 'react';
import { Star, GitFork, BookOpen, Code2, Clock, Trophy } from 'lucide-react';
import Card from '../ui/Card';
import './StatsGrid.css';

const StatCard = ({ icon: Icon, title, value, colorClass }) => (
  <Card className="stat-card flex items-center gap-4">
    <div className={`stat-icon-wrapper ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="stat-title text-secondary text-sm">{title}</p>
      <h3 className="stat-value text-2xl font-bold">{value}</h3>
    </div>
  </Card>
);

const StatsGrid = ({ stats, user }) => {
  const accountAgeYears = ((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);

  return (
    <div className="stats-grid">
      <StatCard 
        icon={Star} 
        title="Total Stars" 
        value={stats.totalStars} 
        colorClass="text-yellow" 
      />
      <StatCard 
        icon={GitFork} 
        title="Total Forks" 
        value={stats.totalForks} 
        colorClass="text-blue" 
      />
      <StatCard 
        icon={BookOpen} 
        title="Total Repositories" 
        value={stats.totalRepos} 
        colorClass="text-green" 
      />
      <StatCard 
        icon={Code2} 
        title="Top Language" 
        value={stats.topLanguage} 
        colorClass="text-purple" 
      />
      <StatCard 
        icon={Trophy} 
        title="Languages Used" 
        value={stats.totalLanguagesUsed} 
        colorClass="text-orange" 
      />
      <StatCard 
        icon={Clock} 
        title="Account Age" 
        value={`${accountAgeYears} yrs`} 
        colorClass="text-red" 
      />
    </div>
  );
};

export default StatsGrid;
