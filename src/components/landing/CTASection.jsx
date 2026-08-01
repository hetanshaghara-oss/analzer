import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import Reveal from './Reveal';
import './CTASection.css';

const CTASection = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) navigate(`/dashboard/${username.trim()}`);
  };

  return (
    <section className="cta-section">
      <div className="container">
        <Reveal direction="scale">
          <div className="cta-panel">
            <div className="cta-orb cta-orb--1" />
            <div className="cta-orb cta-orb--2" />
            <div className="cta-grid-bg" />
            <div className="cta-sweep" />

            <div className="cta-inner">
              <Sparkles size={40} className="cta-sparkle" />
              <h2 className="cta-title">Ready to uncover the truth?</h2>
              <p className="cta-desc">
                Type any GitHub username and unlock the most comprehensive developer intelligence report available — for free.
              </p>

              <form className="cta-search" onSubmit={handleSubmit}>
                <Search size={18} className="cta-search-icon" />
                <input
                  type="text"
                  placeholder="Enter a GitHub username…"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="cta-input"
                />
                <button type="submit" className="cta-btn">
                  Start Analyzing <ArrowRight size={17} />
                </button>
              </form>

              <p className="cta-note">
                No signup required · Public profiles only · Free forever
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTASection;
