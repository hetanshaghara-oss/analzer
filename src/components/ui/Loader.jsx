import React from 'react';
import { Loader2 } from 'lucide-react';
import './Loader.css';

const Loader = ({ size = 24, className = '', text = 'Loading...' }) => {
  return (
    <div className={`loader-container ${className}`}>
      <Loader2 size={size} className="loader-icon spinner" />
      {text && <p className="loader-text text-muted">{text}</p>}
    </div>
  );
};

export default Loader;
