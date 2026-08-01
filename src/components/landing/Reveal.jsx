import React from 'react';
import { useInView } from '../../hooks/useInView';
import './Reveal.css';

const Reveal = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const [ref, inView] = useInView({ threshold: 0.12 });

  return (
    <div
      ref={ref}
      className={`reveal reveal--${direction} ${inView ? 'reveal--visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default Reveal;
