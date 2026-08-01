import React, { useMemo } from 'react';
import SpotlightCard from '../ui/SpotlightCard';
import { Briefcase, GitBranch, Star, Calendar } from 'lucide-react';
import './CareerJourney.css';

const CareerJourney = ({ linkedinData, repos }) => {
  const timelineEvents = useMemo(() => {
    const events = [];

    // 1. Process LinkedIn Data
    if (linkedinData && linkedinData.length > 0) {
      linkedinData.forEach(job => {
        let dateVal = new Date();
        if (job.startDate && job.startDate.toLowerCase() !== 'unknown') {
          // LinkedIn format is usually "MMM YYYY" or "YYYY-MM"
          const parsed = new Date(job.startDate);
          if (!isNaN(parsed)) dateVal = parsed;
        }

        events.push({
          id: `li-${job.company}-${job.startDate}`,
          type: 'linkedin',
          title: job.title,
          subtitle: job.company,
          date: dateVal,
          dateString: `${job.startDate} - ${job.endDate}`,
          description: job.description,
          icon: Briefcase,
          color: '#0077b5' // LinkedIn Blue
        });
      });
    }

    // 2. Process GitHub Milestones
    if (repos && repos.length > 0) {
      // Sort repos by creation date
      const sortedRepos = [...repos].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      // Milestone: First Repo
      const firstRepo = sortedRepos[0];
      events.push({
        id: `gh-first-${firstRepo.id}`,
        type: 'github',
        title: 'Began Open Source Journey',
        subtitle: `Created first repository: ${firstRepo.name}`,
        date: new Date(firstRepo.created_at),
        dateString: new Date(firstRepo.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }),
        description: firstRepo.description || 'The beginning of a coding adventure.',
        icon: GitBranch,
        color: '#2ea043' // GitHub Green
      });

      // Milestone: Most Starred Repo
      const mostStarred = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
      if (mostStarred && mostStarred.stargazers_count > 0 && mostStarred.id !== firstRepo.id) {
        events.push({
          id: `gh-star-${mostStarred.id}`,
          type: 'github',
          title: 'Achieved Open Source Fame',
          subtitle: `Created masterpiece: ${mostStarred.name} (${mostStarred.stargazers_count} ⭐)`,
          date: new Date(mostStarred.created_at),
          dateString: new Date(mostStarred.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }),
          description: mostStarred.description || 'A highly appreciated community contribution.',
          icon: Star,
          color: '#e3b341' // Star Yellow
        });
      }
    }

    // Sort all events chronologically (newest first)
    return events.sort((a, b) => b.date - a.date);
  }, [linkedinData, repos]);

  if (timelineEvents.length === 0) {
    return <div className="text-center p-8 text-secondary">No career data available.</div>;
  }

  return (
    <div className="career-journey-container animate-fade-in">
      <div className="cj-header">
        <h2 className="cj-title">Career Journey</h2>
        <p className="cj-subtitle">The woven timeline of corporate experience and open-source milestones.</p>
      </div>

      <div className="cj-timeline">
        <div className="cj-line" />
        
        {timelineEvents.map((event, index) => {
          const Icon = event.icon;
          const isLeft = index % 2 === 0;

          return (
            <div key={event.id} className={`cj-item ${isLeft ? 'cj-item-left' : 'cj-item-right'}`}>
              <div className="cj-marker" style={{ backgroundColor: event.color, boxShadow: `0 0 15px ${event.color}88` }}>
                <Icon size={16} color="#fff" />
              </div>

              <SpotlightCard className="cj-card" spotlightColor={`${event.color}22`}>
                <div className="cj-card-inner">
                  <div className="cj-date" style={{ color: event.color }}>
                    <Calendar size={14} />
                    {event.dateString}
                  </div>
                  <h3 className="cj-card-title">{event.title}</h3>
                  <h4 className="cj-card-subtitle">{event.subtitle}</h4>
                  {event.description && (
                    <p className="cj-card-desc">{event.description}</p>
                  )}
                  <div className="cj-badge" style={{ backgroundColor: `${event.color}22`, color: event.color }}>
                    {event.type === 'linkedin' ? 'Corporate' : 'Open Source'}
                  </div>
                </div>
              </SpotlightCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CareerJourney;
