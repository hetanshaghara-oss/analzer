import React from 'react';
import { GraduationCap, Rocket, Lightbulb } from 'lucide-react';
import './AIComponents.css';

const CareerRoadmap = ({ roadmap }) => {
  return (
    <div className="ai-card">
      <h3 className="ai-card-title">
        <span className="ai-title-emoji">🛣️</span> AI Career Roadmap
      </h3>

      <div className="ai-current-level">
        <div className="ai-icon-box"><GraduationCap size={20} /></div>
        <div>
          <p className="ai-current-level-label">Current Level</p>
          <p className="ai-current-level-value">{roadmap.level}</p>
        </div>
      </div>

      <div>
        <h4 className="ai-sub-head">
          <Rocket size={17} style={{ color: 'hsl(var(--color-blue))' }} /> Recommended Next Skills
        </h4>
        <div className="roadmap-list">
          {roadmap.nextSkills.map((skill, idx) => (
            <div key={idx} className="roadmap-step is-done">
              <div className="roadmap-bullet" />
              <p>{skill}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="ai-sub-head">
          <Lightbulb size={17} /> Recommended Projects
        </h4>
        <div className="ai-sw-list">
          {roadmap.nextProjects.map((project, idx) => (
            <div key={idx} className="ai-item-card is-project">
              <div className="ai-icon-box">
                <span className="ai-title-emoji" style={{ fontSize: '0.9rem' }}>{idx + 1}</span>
              </div>
              <p>{project}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerRoadmap;
