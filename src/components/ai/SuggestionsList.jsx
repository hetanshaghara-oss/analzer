import React from 'react';
import { Lightbulb } from 'lucide-react';
import './AIComponents.css';

const SuggestionsList = ({ suggestions }) => {
  return (
    <div className="ai-card">
      <h3 className="ai-card-title">
        <span className="ai-title-emoji">💡</span> AI Suggestions
      </h3>
      <div className="ai-sw-list">
        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="ai-item-card is-suggestion">
            <div className="ai-icon-box"><Lightbulb size={18} /></div>
            <p>{suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestionsList;
