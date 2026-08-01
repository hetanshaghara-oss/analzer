import React from 'react';
import { Star, GitFork, Eye, AlertCircle, Calendar, HardDrive, Users, Tag } from 'lucide-react';
import Card from '../ui/Card';

const MetaStat = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm">
    <Icon size={14} className="text-muted shrink-0" />
    <span className="text-secondary">{label}:</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const RepoOverviewCard = ({ repoData, summary }) => {
  return (
    <Card className="review-overview-card">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-2xl font-bold">{repoData.name}</h2>
              <span className="text-xs px-2 py-1 rounded-full border font-medium uppercase tracking-wider">
                {repoData.visibility}
              </span>
              {summary.topics.slice(0, 3).map(topic => (
                <span key={topic} className="text-xs px-2 py-1 rounded-full bg-blue-op text-blue font-medium">
                  {topic}
                </span>
              ))}
            </div>
            <p className="text-secondary leading-relaxed max-w-2xl">
              {summary.overview}
            </p>
          </div>
          <a
            href={repoData.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary shrink-0 text-sm"
          >
            View on GitHub ↗
          </a>
        </div>

        <div className="grid grid-cols-2 sm-grid-cols-3 lg-grid-cols-6 gap-4 pt-4 border-t">
          <MetaStat icon={Star} label="Stars" value={repoData.stargazers_count.toLocaleString()} />
          <MetaStat icon={GitFork} label="Forks" value={repoData.forks_count.toLocaleString()} />
          <MetaStat icon={Eye} label="Watchers" value={repoData.watchers_count.toLocaleString()} />
          <MetaStat icon={AlertCircle} label="Issues" value={repoData.open_issues_count} />
          <MetaStat icon={HardDrive} label="Size" value={`${(repoData.size / 1024).toFixed(1)} MB`} />
          <MetaStat icon={Users} label="Contributors" value={summary.contributorCount} />
        </div>

        <div className="grid grid-cols-2 sm-grid-cols-4 gap-4 pt-4 border-t text-sm">
          <div>
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Tech Stack</p>
            <p className="font-semibold">{summary.techStack}</p>
          </div>
          <div>
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Complexity</p>
            <p className={`font-semibold ${summary.complexity === 'High' ? 'text-red' : summary.complexity === 'Medium' ? 'text-yellow' : 'text-green'}`}>
              {summary.complexity}
            </p>
          </div>
          <div>
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Age</p>
            <p className="font-semibold">{summary.ageYears > 0 ? `${summary.ageYears} yr(s)` : 'New'}</p>
          </div>
          <div>
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Root Files</p>
            <p className="font-semibold">{summary.rootFileCount}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RepoOverviewCard;
