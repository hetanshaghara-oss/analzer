import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ value, duration = 1000, isCurrency = false, isDecimal = false }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const finalValue = parseFloat(value) || 0;
    
    if (finalValue === 0) {
      setCount(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutQuart easing function
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentCount = easeProgress * finalValue;
      
      setCount(currentCount);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(finalValue);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value, duration]);

  const displayValue = isDecimal 
    ? count.toFixed(1) 
    : Math.floor(count);

  return (
    <span>{isCurrency ? `$${displayValue}` : displayValue}</span>
  );
};

export default AnimatedCounter;
