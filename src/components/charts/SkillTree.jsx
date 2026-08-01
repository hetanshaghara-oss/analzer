import React, { useMemo } from 'react';
import { calculateSkillTree } from '../../services/github';
import SpotlightCard from '../ui/SpotlightCard';
import { Wand2, Shield, FlaskConical, Crosshair, Crown, Lock } from 'lucide-react';
import './SkillTree.css';

const IconMap = {
  wand: Wand2,
  shield: Shield,
  potion: FlaskConical,
  bow: Crosshair,
  crown: Crown
};

const SkillTree = ({ repos }) => {
  const skills = useMemo(() => calculateSkillTree(repos), [repos]);

  if (!skills || skills.length === 0) {
    return <div className="text-center p-10 text-secondary">No repository data available to calculate skills.</div>;
  }

  return (
    <div className="skill-tree-container animate-fade-in">
      <div className="skill-tree-header">
        <h2 className="skill-tree-title">Developer Skill Tree</h2>
        <p className="skill-tree-subtitle">Unlock specialized RPG classes based on your repository architecture.</p>
      </div>

      <div className="skill-grid">
        {skills.map(skill => {
          const Icon = IconMap[skill.icon];
          const isUnlocked = skill.isUnlocked;

          return (
            <SpotlightCard 
              key={skill.id} 
              className={`skill-card ${isUnlocked ? 'unlocked' : 'locked'}`}
              spotlightColor={isUnlocked ? `${skill.color}33` : 'rgba(255,255,255,0.05)'}
            >
              <div className="skill-card-inner">
                
                <div 
                  className="skill-icon-box"
                  style={{ 
                    '--skill-color': skill.color,
                    boxShadow: isUnlocked ? `0 0 30px -5px ${skill.color}66, inset 0 0 20px ${skill.color}33` : 'none',
                    borderColor: isUnlocked ? `${skill.color}88` : '#333'
                  }}
                >
                  {isUnlocked ? (
                    <Icon size={32} color={skill.color} className="skill-icon drop-shadow-glow" />
                  ) : (
                    <Lock size={32} color="#555" className="skill-icon" />
                  )}
                </div>

                <div className="skill-info">
                  <h3 className="skill-name" style={{ color: isUnlocked ? skill.color : '#666' }}>
                    {skill.name}
                  </h3>
                  <p className="skill-desc">{skill.description}</p>
                </div>

                <div className="skill-progress-section">
                  <div className="skill-progress-header">
                    <span className="skill-progress-label">Unlock Progress</span>
                    <span className="skill-progress-pct" style={{ color: isUnlocked ? skill.color : '#888' }}>
                      {Math.round(skill.progress)}%
                    </span>
                  </div>
                  <div className="skill-progress-bar-bg">
                    <div 
                      className="skill-progress-bar-fill" 
                      style={{ 
                        width: `${skill.progress}%`, 
                        backgroundColor: isUnlocked ? skill.color : '#555',
                        boxShadow: isUnlocked ? `0 0 10px ${skill.color}` : 'none'
                      }} 
                    />
                  </div>
                </div>

                {isUnlocked && skill.repos.length > 0 && (
                  <div className="skill-repos">
                    <p className="skill-repos-title">Top Contributing Repos:</p>
                    <div className="skill-repo-tags">
                      {skill.repos.map(r => (
                        <span key={r} className="skill-repo-tag" style={{ borderLeftColor: skill.color }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </div>
  );
};

export default SkillTree;
