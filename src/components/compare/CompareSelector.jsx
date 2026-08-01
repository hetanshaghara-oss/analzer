import React, { useState } from 'react';
import { Search, Plus, X, Swords, ChevronRight } from 'lucide-react';
import SpotlightCard from '../ui/SpotlightCard';

const CompareSelector = ({ selectedUsers, onAddUser, onRemoveUser, onCompare }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    if (input.trim() && !selectedUsers.includes(input.trim()) && selectedUsers.length < 5) {
      onAddUser(input.trim());
      setInput('');
    }
  };

  return (
    <div className="cs-wrapper animate-fade-in">
      <SpotlightCard className="cs-card" spotlightColor="rgba(244, 63, 94, 0.15)">
        <div className="spotlight-content cs-content">
          
          <div className="cs-header">
            <div className="cs-icon-box">
              <Swords size={40} className="cs-icon-swords" />
            </div>
            <h1 className="cs-title">
              Enter The Arena
            </h1>
            <p className="cs-subtitle">
              Draft 2 to 5 GitHub profiles and pit them against each other in a head-to-head architectural showdown.
            </p>
          </div>

          <form onSubmit={handleAdd} className="cs-form">
            <div className={`hero-search-wrapper cs-search-wrapper ${isFocused ? 'focused' : ''}`}>
              <div className="search-glow-border cs-glow-border" />
              <div className="search-input-container">
                <Search className="search-icon" size={24} />
                <input
                  type="text"
                  placeholder="Enter a GitHub username (e.g. torvalds)..."
                  className="hero-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={selectedUsers.length >= 5}
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="hero-submit-btn cs-submit-btn"
                  disabled={!input.trim() || selectedUsers.length >= 5}
                >
                  <Plus size={20} />
                  <span>Draft</span>
                </button>
              </div>
            </div>
          </form>

          {selectedUsers.length > 0 && (
            <div className="cs-draft-section">
              <h3 className="cs-draft-title">
                Drafted Combatants ({selectedUsers.length}/5)
              </h3>
              <div className="cs-draft-list">
                {selectedUsers.map(user => (
                  <div key={user} className="cs-draft-item">
                    <span className="cs-draft-name">{user}</span>
                    <button 
                      onClick={() => onRemoveUser(user)} 
                      className="cs-draft-remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="cs-action-section">
            <button 
              onClick={onCompare}
              disabled={selectedUsers.length < 2}
              className={`cs-start-btn ${selectedUsers.length >= 2 ? 'active' : 'disabled'}`}
            >
              {selectedUsers.length < 2 ? 'Draft at least 2' : 'Start Simulation'}
              {selectedUsers.length >= 2 && <ChevronRight size={24} />}
            </button>
          </div>

        </div>
      </SpotlightCard>
    </div>
  );
};

export default CompareSelector;
