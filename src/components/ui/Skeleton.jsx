import React from 'react';
import './Skeleton.css';

const Skeleton = ({ className = '', variant = 'rectangular', ...props }) => {
  return (
    <div 
      className={`skeleton skeleton-${variant} ${className}`} 
      {...props}
    />
  );
};

export default Skeleton;
