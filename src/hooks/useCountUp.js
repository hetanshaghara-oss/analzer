import { useEffect, useState } from 'react';
import { useInView } from './useInView';

/**
 * Scroll-triggered count-up. Animates from `start` to `target` when the
 * returned ref enters the viewport. Returns [ref, displayString].
 */
export function useCountUp(target, { duration = 1800, start = 0, decimals = 0, format = true } = {}) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const [value, setValue] = useState(start);

  useEffect(() => {
    if (!inView) return;

    let raf;
    let startTime = null;

    const step = (ts) => {
      if (startTime === null) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setValue(start + (target - start) * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, start]);

  const raw = decimals > 0 ? value.toFixed(decimals) : Math.round(value);
  const display = format ? Number(raw).toLocaleString('en-US') : String(raw);

  return [ref, display];
}
