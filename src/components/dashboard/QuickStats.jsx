import React from 'react';
import { Star, GitFork, BookOpen, HardDrive, Hash, Activity } from 'lucide-react';
import Card from '../ui/Card';
import AnimatedCounter from '../ui/AnimatedCounter';

const StatCard = ({ icon: Icon, title, value, colorClass, isDecimal = false, suffix = '' }) => (
  <Card className="stat-card flex items-center gap-4">
    <div className={`stat-icon-wrapper ${colorClass} bg-${colorClass.split('-')[1]}-op`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="stat-title text-secondary text-sm">{title}</p>
      <h3 className="stat-value text-2xl font-bold flex items-baseline gap-1">
        {typeof value === 'number' ? (
          <AnimatedCounter value={value} isDecimal={isDecimal} />
        ) : (
          value
        )}
        {suffix && <span className="text-sm font-normal text-muted">{suffix}</span>}
      </h3>
    </div>
  </Card>
);

const QuickStats = ({ stats }) => {
  return (
    <div className="stats-grid">
      <StatCard 
        icon={Star} 
        title="Avg. Stars / Repo" 
        value={parseFloat(stats.avgStars)} 
        colorClass="text-yellow"
        isDecimal={true}
      />
      <StatCard 
        icon={GitFork} 
        title="Avg. Forks / Repo" 
        value={parseFloat(stats.avgForks)} 
        colorClass="text-blue" 
        isDecimal={true}
      />
      <StatCard 
        icon={HardDrive} 
        title="Avg. Repo Size" 
        value={parseFloat(stats.avgSize)} 
        colorClass="text-green" 
        suffix="KB"
      />
      <StatCard 
        icon={BookOpen} 
        title="Total Size" 
        value={(stats.totalSize / 1024).toFixed(1)} 
        colorClass="text-purple"
        suffix="MB"
      />
      <StatCard 
        icon={Hash} 
        title="Language Diversity" 
        value={stats.totalLanguagesUsed} 
        colorClass="text-orange" 
      />
      <StatCard 
        icon={Activity} 
        title="Repo Growth" 
        value={stats.repoGrowth} 
        colorClass="text-red" 
      />
    </div>
  );
};

export default QuickStats;
