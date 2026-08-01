import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import './AIComponents.css';

const StrengthsWeaknesses = ({ strengths, weaknesses }) => {
  return (
    <div className="ai-row">
      <div className="ai-card is-strengths">
        <h3 className="ai-card-title">
          <span className="ai-title-emoji">💪</span> Core Strengths
        </h3>
        <div className="ai-sw-list">
          {strengths.map((str, idx) => (
            <div key={`str-${idx}`} className="ai-item-card is-strength">
              <div className="ai-icon-box">
                <CheckCircle2 size={20} />
              </div>
              <p>{str}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="ai-card is-weaknesses">
        <h3 className="ai-card-title">
          <span className="ai-title-emoji">⚠️</span> Areas for Improvement
        </h3>
        <div className="ai-sw-list">
          {weaknesses.map((weak, idx) => (
            <div key={`weak-${idx}`} className="ai-item-card is-weakness">
              <div className="ai-icon-box">
                <XCircle size={20} />
              </div>
              <p>{weak}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StrengthsWeaknesses;
