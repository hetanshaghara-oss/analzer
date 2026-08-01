import React from 'react';
import './Templates.css';

const ResumeTemplate = ({ data }) => {
  const { personalInfo, skills, projects, experience, education, certifications, achievements } = data;

  return (
    <div className="resume-preview-frame">
      {/* Header */}
      <div className="resume-header">
        <h1 className="resume-title">{personalInfo.fullName}</h1>
        <p className="resume-subtitle">{personalInfo.title}</p>
        <div className="resume-contact">
          {personalInfo.email && <span>📧 {personalInfo.email}</span>}
          {personalInfo.location && <span>📍 {personalInfo.location}</span>}
          {personalInfo.website && <span>🌐 {personalInfo.website}</span>}
          <span>💻 github.com/{personalInfo.github}</span>
        </div>
      </div>

      {/* Summary */}
      {personalInfo.bio && (
        <div className="resume-section">
          <h3 className="resume-section-title">Professional Summary</h3>
          <p className="resume-experience-desc">{personalInfo.bio}</p>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="resume-section">
          <h3 className="resume-section-title">Technical Skills</h3>
          <div className="resume-experience-desc">
            {skills.map((skillGroup, idx) => (
              <div key={idx} className="mb-2">
                <strong>{skillGroup.category}:</strong> {skillGroup.items.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="resume-section">
          <h3 className="resume-section-title">Professional Experience</h3>
          {experience.map((exp, idx) => (
            <div key={idx} className="mb-4">
              <div className="resume-item-header">
                <span>{exp.role}</span>
                <span>{exp.period}</span>
              </div>
              <div className="text-sm font-medium text-secondary mb-1">{exp.company}</div>
              <p className="resume-experience-desc">{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Featured Projects */}
      {projects.length > 0 && (
        <div className="resume-section">
          <h3 className="resume-section-title">Featured Projects</h3>
          {projects.map((proj, idx) => (
            <div key={idx} className="mb-3">
              <div className="resume-item-header">
                <span>{proj.name}</span>
                {proj.language && <span className="resume-lang-badge">{proj.language}</span>}
              </div>
              <p className="resume-experience-desc mb-1">{proj.description}</p>
              <div className="text-xs text-muted">
                GitHub: {proj.url} {proj.liveUrl && `| Live: ${proj.liveUrl}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="resume-section">
          <h3 className="resume-section-title">Education</h3>
          {education.map((edu, idx) => (
            <div key={idx} className="resume-item-header mb-2">
              <span>{edu.degree} — {edu.school}</span>
              <span>{edu.year}</span>
            </div>
          ))}
        </div>
      )}

      {/* Certifications & Achievements */}
      {(certifications.length > 0 || achievements.length > 0) && (
        <div className="grid grid-cols-1 md-grid-cols-2 gap-6 mt-4">
          {certifications.length > 0 && (
            <div>
              <h3 className="resume-section-title">Certifications</h3>
              <ul className="list-disc pl-4 text-sm text-secondary flex flex-col gap-1">
                {certifications.map((cert, idx) => (
                  <li key={idx}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
          {achievements.length > 0 && (
            <div>
              <h3 className="resume-section-title">Key Achievements</h3>
              <ul className="list-disc pl-4 text-sm text-secondary flex flex-col gap-1">
                {achievements.map((ach, idx) => (
                  <li key={idx}>{ach}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeTemplate;
