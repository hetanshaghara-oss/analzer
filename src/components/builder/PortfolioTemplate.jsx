import { ExternalLink, Star, GitFork, Award, Globe, Mail, MapPin } from 'lucide-react';
import { GithubIcon } from '../ui/icons';
import './Templates.css';

const PortfolioTemplate = ({ data, themeClass }) => {
  const { personalInfo, skills, projects, experience, education, achievements, sectionOrder } = data;

  const renderSection = (sectionId) => {
    switch (sectionId) {
      case 'about':
        return (
          <section key="about" className="portfolio-section" id="about">
            <h3 className="portfolio-section-title">About Me</h3>
            <p className="leading-relaxed text-secondary text-lg max-w-3xl">
              {personalInfo.bio}
            </p>
            <div className="flex gap-4 mt-6 flex-wrap text-sm text-secondary">
              {personalInfo.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> {personalInfo.location}
                </span>
              )}
              {personalInfo.email && (
                <span className="flex items-center gap-1">
                  <Mail size={16} /> {personalInfo.email}
                </span>
              )}
            </div>
          </section>
        );

      case 'skills':
        return (
          <section key="skills" className="portfolio-section" id="skills">
            <h3 className="portfolio-section-title">Technical Expertise</h3>
            <div className="space-y-6">
              {skills.map((skillGroup, idx) => (
                <div key={idx} className="portfolio-skills-category">
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-3 text-secondary">
                    {skillGroup.category}
                  </h4>
                  <div className="portfolio-skills-tags">
                    {skillGroup.items.map(skill => (
                      <span key={skill} className="portfolio-skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'projects':
        return (
          <section key="projects" className="portfolio-section" id="projects">
            <h3 className="portfolio-section-title">Featured Projects</h3>
            <div className="portfolio-projects-grid">
              {projects.map((proj, idx) => (
                <div key={idx} className="portfolio-project-card">
                  <div>
                    <h4 className="text-xl font-bold mb-2">{proj.name}</h4>
                    <p className="text-sm text-secondary mb-4 line-clamp-2">{proj.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{ borderColor: 'var(--port-border)' }}>
                    <div className="flex gap-4 text-xs text-secondary">
                      {proj.language && <span className="font-semibold">{proj.language}</span>}
                      {proj.stars > 0 && <span className="flex items-center gap-1"><Star size={12} /> {proj.stars}</span>}
                      {proj.forks > 0 && <span className="flex items-center gap-1"><GitFork size={12} /> {proj.forks}</span>}
                    </div>
                    <div className="flex gap-2">
                      <a href={proj.url} target="_blank" rel="noopener noreferrer" className="hover-accent" title="View Source">
                        <GithubIcon size={16} />
                      </a>
                      {proj.liveUrl && (
                        <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" className="hover-accent" title="View Live">
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'stats':
        return (
          <section key="stats" className="portfolio-section" id="stats">
            <h3 className="portfolio-section-title">GitHub Statistics</h3>
            <div className="portfolio-projects-grid">
              {achievements.map((ach, idx) => (
                <div key={idx} className="portfolio-project-card flex-row items-center gap-4">
                  <div className="ai-icon-box bg-blue-op text-blue rounded-full">
                    <Award size={20} />
                  </div>
                  <p className="text-sm font-semibold text-secondary">{ach}</p>
                </div>
              ))}
            </div>
          </section>
        );

      case 'experience':
        return (
          <section key="experience" className="portfolio-section" id="experience">
            <h3 className="portfolio-section-title">Professional Journey</h3>
            <div className="space-y-8">
              {experience.map((exp, idx) => (
                <div key={idx} className="relative pl-6 border-l" style={{ borderColor: 'var(--port-border)' }}>
                  <div className="absolute left-[-5px] top-1.5 w-[9px] height-[9px] rounded-full" style={{ backgroundColor: 'var(--port-accent)' }} />
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-1">
                    <h4 className="text-lg font-bold">{exp.role}</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary">{exp.period}</span>
                  </div>
                  <div className="text-sm font-medium text-secondary mb-2">{exp.company}</div>
                  <p className="text-sm text-secondary leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        );

      case 'education':
        return (
          <section key="education" className="portfolio-section" id="education">
            <h3 className="portfolio-section-title">Education</h3>
            <div className="space-y-6">
              {education.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-lg font-bold">{edu.school}</h4>
                    <span className="text-xs text-secondary">{edu.year}</span>
                  </div>
                  <p className="text-sm text-secondary">{edu.degree}</p>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`portfolio-preview-frame ${themeClass}`}>
      {/* Hero */}
      <header className="portfolio-hero">
        <h1 className="portfolio-hero-title">{personalInfo.fullName}</h1>
        <p className="portfolio-hero-sub">{personalInfo.title}</p>
        <div className="flex justify-center gap-4 mt-6">
          <a href={`https://github.com/${personalInfo.github}`} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ backgroundColor: 'var(--port-accent)' }}>
            GitHub Profile
          </a>
          {personalInfo.website && (
            <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--port-border)', color: 'var(--port-text-main)' }}>
              Visit Website
            </a>
          )}
        </div>
      </header>

      {/* Render Sections in configured order */}
      {sectionOrder.map(sectionId => renderSection(sectionId))}

      {/* Footer */}
      <footer className="py-12 text-center text-xs text-secondary border-t" style={{ borderColor: 'var(--port-border)' }}>
        <p>Built automatically with GitInsight AI &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default PortfolioTemplate;
