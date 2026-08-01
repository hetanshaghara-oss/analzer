import React, { useEffect, useRef } from 'react';
import './Wave3D.css';

/* ══════════════════════════════════════
   WAVE3D — Animated 3D wireframe wave floor
   A perspective sine-wave mesh on a <canvas>,
   used as an ambient background layer in the
   hero. Theme-aware (reads --accent-primary,
   --color-purple, --color-blue), pauses when
   scrolled out of view, and honours
   `prefers-reduced-motion`.
══════════════════════════════════════ */

const COLS = 56;   // mesh columns — across the screen
const ROWS = 30;   // mesh rows   — into the distance

// Surface height at a grid point.
// x ∈ [-1, 1] across the screen, d ∈ [0, 1] depth (0 = far, 1 = near).
const waveHeight = (x, d, t) => {
  const r = Math.hypot(x * 1.7, d);
  return (
    Math.sin(r * 4.8 - t * 1.2) * 0.55 +        // ripples expanding from center
    Math.sin(x * 3.2 + d * 2.6 - t * 0.8) * 0.32 + // diagonal swell
    Math.sin(x * 6.0 + t * 2.4) * 0.13          // fine surface chop
  );
};

const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

// HSL triplet (h s% l%) → [r, g, b]
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

// Read a theme CSS var like `--accent-primary` (value "231 97% 62%") → rgb triplet.
const cssVarToRgb = (name) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw.split(/\s+/).map(Number);
  return parts.length === 3 ? hslToRgb(parts[0], parts[1], parts[2]) : [91, 110, 245];
};

const Wave3D = () => {
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

    // Rebuild colors when the theme flips (data-theme attribute changes).
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

    // Project a grid point (x, d, wave offset) to screen space with a
    // perspective floor: rows bunch near the horizon and spread towards
    // the viewer, nearer points scaling up in width and wave height.
    const draw = (now) => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (W === 0 || H === 0) return;

      ctx.clearRect(0, 0, W, H);

      const t = reduceMotion ? 0 : now / 1000;
      const cx = W * 0.5;
      const horizonY = H * 0.26;
      const maxDepth = H * 1.02;
      const waveAmp = H * 0.05;

      const toScreen = (x, d, s, wave) => {
        const sx = cx + x * W * 0.52 * s;
        const sy = horizonY + Math.pow(d, 1.5) * maxDepth - wave * waveAmp * s;
        return [sx, sy];
      };
      const scaleAt = (d) => 0.12 + 0.88 * Math.pow(d, 1.7);

      // ── Vertical columns: faint uniform accent connecting the rows ──
      ctx.lineWidth = 1;
      for (let ix = 0; ix < COLS; ix++) {
        const x = (ix / (COLS - 1)) * 2 - 1;
        ctx.beginPath();
        for (let ir = 0; ir < ROWS; ir++) {
          const d = ir / (ROWS - 1);
          const [sx, sy] = toScreen(x, d, scaleAt(d), waveHeight(x, d, t));
          if (ir === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = `rgba(${colors.accent.join(',')}, 0.09)`;
        ctx.stroke();
      }

      // ── Horizontal rows: depth-graded blue → accent → purple ──
      for (let ir = 0; ir < ROWS; ir++) {
        const d = ir / (ROWS - 1);
        const s = scaleAt(d);
        const rgb = d <= 0.5
          ? mix(colors.blue, colors.accent, d / 0.5)
          : mix(colors.accent, colors.purple, (d - 0.5) / 0.5);
        const alpha = 0.05 + d * 0.4;

        ctx.lineWidth = d > 0.55 ? 1.25 : 1;
        ctx.beginPath();
        for (let ix = 0; ix < COLS; ix++) {
          const x = (ix / (COLS - 1)) * 2 - 1;
          const [sx, sy] = toScreen(x, d, s, waveHeight(x, d, t));
          if (ix === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
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

  return <canvas ref={canvasRef} className="wave3d" aria-hidden="true" />;
};

export default Wave3D;
