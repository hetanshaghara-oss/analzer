import React, { useState, useEffect, useMemo } from 'react';
import { calculateYearlyStats } from '../../services/github';
import TiltCard from '../ui/TiltCard';
import { Code2, BookOpen, Star } from 'lucide-react';
import './TimeMachine.css';

const TimeMachine = ({ repos }) => {
  const [selectedYear, setSelectedYear] = useState(null);
  
  const yearlyStats = useMemo(() => calculateYearlyStats(repos), [repos]);
  const years = useMemo(() => Object.keys(yearlyStats).sort(), [yearlyStats]);

  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[years.length - 1]); // Default to latest year
    }
  }, [years, selectedYear]);

  if (years.length === 0) {
    return <div className="text-center p-8 text-secondary">No repository history available.</div>;
  }

  const currentStats = yearlyStats[selectedYear];
  const currentIndex = years.indexOf(String(selectedYear));

  const handleSliderChange = (e) => {
    const index = parseInt(e.target.value, 10);
    setSelectedYear(years[index]);
  };

  return (
    <div className="time-machine-wrapper">
      <div className="tm-bg-glow" />
      
      <div className="tm-header">
        <h2 className="tm-title">Codebase Time Machine</h2>
        <p className="tm-subtitle">Scrub through the years to see how the tech stack evolved</p>
      </div>

      {currentStats && (
        <TiltCard maxTilt={8} scale={1.02} className="tm-display-card animate-slide-up" key={selectedYear}>
          <div className="tm-year-huge tilt-child">{selectedYear}</div>
          
          <div className="tm-stats-grid tilt-child">
            <div className="tm-stat-box">
              <div className="tm-stat-label flex items-center justify-center gap-2">
                <Code2 size={16} /> Top Language
              </div>
              <div className="tm-stat-value">{currentStats.dominantLanguage}</div>
            </div>
            
            <div className="tm-stat-box">
              <div className="tm-stat-label flex items-center justify-center gap-2">
                <BookOpen size={16} /> Repos Created
              </div>
              <div className="tm-stat-value">{currentStats.repoCount}</div>
            </div>
          </div>

          {currentStats.topRepo && (
            <div className="tm-stat-box tilt-child" style={{ background: 'transparent' }}>
              <div className="tm-stat-label flex items-center justify-center gap-2 text-warning mb-2">
                <Star size={16} /> Crown Jewel of {selectedYear}
              </div>
              <div className="font-bold text-lg mb-1">{currentStats.topRepo.name}</div>
              <div className="text-sm text-secondary line-clamp-2">{currentStats.topRepo.description}</div>
            </div>
          )}
        </TiltCard>
      )}

      <div className="tm-slider-container">
        <input 
          type="range" 
          min="0" 
          max={years.length - 1} 
          value={currentIndex !== -1 ? currentIndex : 0}
          onChange={handleSliderChange}
          className="tm-slider"
        />
        <div className="tm-ticks">
          {years.map((year, idx) => (
            <div 
              key={year} 
              className={`tm-tick ${String(year) === String(selectedYear) ? 'active' : ''}`}
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeMachine;
