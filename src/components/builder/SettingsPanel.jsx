import React, { useState } from 'react';
import Card from '../ui/Card';
import { ArrowUp, ArrowDown, Settings, User, Code, Briefcase, GraduationCap } from 'lucide-react';
import './BuilderStyles.css';

const SettingsPanel = ({ data, setData, activeTheme, setActiveTheme, activeFont, setActiveFont }) => {
  const [activeSection, setActiveSection] = useState('style');

  const updatePersonalInfo = (field, value) => {
    setData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const updateSkillItems = (catIdx, valueString) => {
    setData(prev => {
      const newSkills = [...prev.skills];
      newSkills[catIdx].items = valueString.split(',').map(s => s.trim()).filter(Boolean);
      return { ...prev, skills: newSkills };
    });
  };

  const moveSection = (idx, direction) => {
    setData(prev => {
      const order = [...prev.sectionOrder];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= order.length) return prev;
      
      const temp = order[idx];
      order[idx] = order[targetIdx];
      order[targetIdx] = temp;
      
      return { ...prev, sectionOrder: order };
    });
  };

  return (
    <Card className="builder-settings-panel h-full flex flex-col p-0 overflow-hidden">
      {/* Sub-header navigation tabs */}
      <div className="flex border-b text-sm font-semibold print-hide">
        <button 
          onClick={() => setActiveSection('style')} 
          className={`flex-1 py-3 text-center border-b-2 transition-all ${activeSection === 'style' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-secondary'}`}
        >
          Styling
        </button>
        <button 
          onClick={() => setActiveSection('profile')} 
          className={`flex-1 py-3 text-center border-b-2 transition-all ${activeSection === 'profile' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-secondary'}`}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveSection('skills')} 
          className={`flex-1 py-3 text-center border-b-2 transition-all ${activeSection === 'skills' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-secondary'}`}
        >
          Skills
        </button>
        <button 
          onClick={() => setActiveSection('layout')} 
          className={`flex-1 py-3 text-center border-b-2 transition-all ${activeSection === 'layout' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-secondary'}`}
        >
          Layout
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 print-hide">
        {/* STYLING TAB */}
        {activeSection === 'style' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-secondary mb-3">Portfolio Theme</h4>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setActiveTheme('theme-sleek-dark')}
                  className={`p-3 rounded border text-xs font-bold transition-all ${activeTheme === 'theme-sleek-dark' ? 'border-blue bg-blue-op text-blue' : 'border'}`}
                >
                  Sleek Dark
                </button>
                <button 
                  onClick={() => setActiveTheme('theme-cyberpunk')}
                  className={`p-3 rounded border text-xs font-bold transition-all ${activeTheme === 'theme-cyberpunk' ? 'border-pink bg-pink-op text-pink' : 'border'}`}
                >
                  Cyberpunk
                </button>
                <button 
                  onClick={() => setActiveTheme('theme-minimal-light')}
                  className={`p-3 rounded border text-xs font-bold transition-all ${activeTheme === 'theme-minimal-light' ? 'border-accent-primary bg-secondary text-primary' : 'border'}`}
                >
                  Minimal Light
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-secondary mb-3">Typography Font</h4>
              <select 
                value={activeFont} 
                onChange={(e) => setActiveFont(e.target.value)}
                className="builder-input"
              >
                <option value="font-sans">Inter (Sans-Serif)</option>
                <option value="font-mono">JetBrains Mono (Monospace)</option>
                <option value="font-serif">Georgia (Serif)</option>
              </select>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeSection === 'profile' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-bold text-secondary uppercase block mb-1">Full Name</label>
              <input 
                type="text" 
                value={data.personalInfo.fullName} 
                onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                className="builder-input" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase block mb-1">Professional Title</label>
              <input 
                type="text" 
                value={data.personalInfo.title} 
                onChange={(e) => updatePersonalInfo('title', e.target.value)}
                className="builder-input" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase block mb-1">Email Address</label>
              <input 
                type="email" 
                value={data.personalInfo.email} 
                onChange={(e) => updatePersonalInfo('email', e.target.value)}
                className="builder-input" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase block mb-1">Location</label>
              <input 
                type="text" 
                value={data.personalInfo.location} 
                onChange={(e) => updatePersonalInfo('location', e.target.value)}
                className="builder-input" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase block mb-1">Professional Bio</label>
              <textarea 
                value={data.personalInfo.bio} 
                onChange={(e) => updatePersonalInfo('bio', e.target.value)}
                className="builder-input builder-textarea" 
              />
            </div>
          </div>
        )}

        {/* SKILLS TAB */}
        {activeSection === 'skills' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-muted leading-relaxed">
              Edit the comma-separated list of skills under each category. Items will automatically update in your previews.
            </p>
            {data.skills.map((skillGroup, idx) => (
              <div key={idx}>
                <label className="text-xs font-bold text-secondary uppercase block mb-1">
                  {skillGroup.category}
                </label>
                <input 
                  type="text" 
                  value={skillGroup.items.join(', ')} 
                  onChange={(e) => updateSkillItems(idx, e.target.value)}
                  className="builder-input" 
                />
              </div>
            ))}
          </div>
        )}

        {/* LAYOUT TAB */}
        {activeSection === 'layout' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-muted leading-relaxed mb-4">
              Rearrange the section ordering of your generated portfolio by clicking the positioning buttons.
            </p>
            <div className="space-y-2">
              {data.sectionOrder.map((sectionId, idx) => (
                <div key={sectionId} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                  <span className="text-sm font-bold uppercase text-secondary">{sectionId}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => moveSection(idx, -1)} 
                      disabled={idx === 0}
                      className="p-1 rounded bg-tertiary hover-accent disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => moveSection(idx, 1)} 
                      disabled={idx === data.sectionOrder.length - 1}
                      className="p-1 rounded bg-tertiary hover-accent disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SettingsPanel;
