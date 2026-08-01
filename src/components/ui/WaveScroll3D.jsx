import React, { useEffect, useRef } from 'react';
import './WaveScroll3D.css';

/* ══════════════════════════════════════════════
   WAVESCROLL3D — Full-page, scroll-driven
   3D wireframe wave background.

   A fixed canvas that spans the entire viewport.
   The wave's vertical phase is locked to the
   page's scroll position so the surface visually
   "flows" as the user scrolls, with a gentle
   time-based overlay for organic movement.
   Theme-aware, pauses offscreen, honours
   prefers-reduced-motion.
══════════════════════════════════════════════ */

const COLS = 52;
const ROWS = 28;

// Surface height at a grid point.
// x ∈ [-1, 1], depth d ∈ [0, 1] (0 = far, 1 = near).
const waveHeight = (x, d, phase) => {
  const r = Math.hypot(x * 1.8, d);
  return (
    Math.sin(r * 4.2 - phase * 1.3) * 0.52 +
    Math.sin(x * 2.9 + d * 2.4 - phase * 0.7) * 0.35 +
    Math.sin(x * 5.6 + phase * 2.0) * 0.13
  );
};

const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const hslToRgb = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4)),
  ];
};

const cssVarToRgb = (name) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw.split(/\s+/).map(Number);
  return parts.length === 3 ? hslToRgb(parts[0], parts[1], parts[2]) : [91, 110, 245];
};

const WaveScroll3D = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colors = { blue: [0, 0, 0], accent: [0, 0, 0], purple: [0, 0, 0] };

    const rebuildColors = () => {
      colors.blue = cssVarToRgb('--color-blue');
      colors.accent = cssVarToRgb('--accent-primary');
      colors.purple = cssVarToRgb('--color-purple');
    };
    rebuildColors();

    const themeObserver = new MutationObserver(rebuildColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const getScrollY = () => {
      // #root is the nearest scrolled container (matches `html { scroll-behavior }`)
      const root = document.getElementById('root');
      return root ? root.scrollTop : window.scrollY;
    };

    const draw = (now) => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (W === 0 || H === 0) return;

      ctx.clearRect(0, 0, W, H);

      // Phase: scroll position (pixels → radians) + slow time overlay
      const scrollPx = reduceMotion ? 0 : getScrollY();
      const t = reduceMotion ? 0 : now / 1000;
      const phase = scrollPx * 0.004 + t * 0.55;

      const cx = W * 0.5;
      const horizonY = H * 0.28;
      const maxDepth = H * 1.05;
      const waveAmp = H * 0.045;

      const scaleAt = (d) => 0.1 + 0.9 * Math.pow(d, 1.75);
      const toScreen = (x, d, s, wave) => [
        cx + x * W * 0.55 * s,
        horizonY + Math.pow(d, 1.5) * maxDepth - wave * waveAmp * s,
      ];

      // ── Vertical columns: faint uniform accent ──
      ctx.lineWidth = 1;
      for (let ix = 0; ix < COLS; ix++) {
        const x = (ix / (COLS - 1)) * 2 - 1;
        ctx.beginPath();
        for (let ir = 0; ir < ROWS; ir++) {
          const d = ir / (ROWS - 1);
          const [sx, sy] = toScreen(x, d, scaleAt(d), waveHeight(x, d, phase));
          if (ir === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = `rgba(${colors.accent.join(',')}, 0.08)`;
        ctx.stroke();
      }

      // ── Horizontal rows: depth-graded blue → accent → purple ──
      for (let ir = 0; ir < ROWS; ir++) {
        const d = ir / (ROWS - 1);
        const s = scaleAt(d);
        const rgb = d <= 0.5
          ? mix(colors.blue, colors.accent, d / 0.5)
          : mix(colors.accent, colors.purple, (d - 0.5) / 0.5);
        const alpha = 0.04 + d * 0.36;

        ctx.lineWidth = d > 0.55 ? 1.2 : 1;
        ctx.beginPath();
        for (let ix = 0; ix < COLS; ix++) {
          const x = (ix / (COLS - 1)) * 2 - 1;
          const [sx, sy] = toScreen(x, d, s, waveHeight(x, d, phase));
          if (ix === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = `rgba(${rgb.join(',')}, ${alpha})`;
        ctx.stroke();
      }
    };

    if (reduceMotion) {
      draw(0);
    } else {
      let raf = 0;
      let visible = true;
      const loop = (now) => {
        if (visible) draw(now);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      observer.observe(canvas);

      return () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        resizeObserver.disconnect();
        themeObserver.disconnect();
      };
    }

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="wave-scroll-3d" aria-hidden="true" />;
};

export default WaveScroll3D;
