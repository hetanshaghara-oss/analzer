import React, { useEffect, useRef } from 'react';
import './FloatingOrbs.css';

/* ── One rotating wireframe orb rendered on a <canvas> ── */
const Orb = ({ size, color, style }) => {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const angleRef  = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = size;
    const H = canvas.height = size;
    const cx = W / 2, cy = H / 2, r = size * 0.42;

    // Parse the hex color to rgba
    const hexToRgba = (hex, alpha) => {
      const h = hex.replace('#', '');
      const bigint = parseInt(h, 16);
      const red   = (bigint >> 16) & 255;
      const green = (bigint >> 8)  & 255;
      const blue  =  bigint        & 255;
      return `rgba(${red},${green},${blue},${alpha})`;
    };

    // Generate icosahedron-like vertex cloud projected on a sphere
    // Use golden ratio spiral for even vertex distribution
    const numPts = 14;
    const pts3d = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    for (let i = 0; i < numPts; i++) {
      const y = 1 - (i / (numPts - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const theta = phi * i;
      pts3d.push({ x: Math.cos(theta) * rad, y, z: Math.sin(theta) * rad });
    }

    // Build edges: connect pairs of vertices that are close
    const edges = [];
    for (let i = 0; i < pts3d.length; i++) {
      for (let j = i + 1; j < pts3d.length; j++) {
        const dx = pts3d[i].x - pts3d[j].x;
        const dy = pts3d[i].y - pts3d[j].y;
        const dz = pts3d[i].z - pts3d[j].z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < 0.95) edges.push([i, j]);
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const angle = angleRef.current;

      // Rotate all points around Y axis (slow spin)
      const cos = Math.cos(angle * 0.7);
      const sin = Math.sin(angle * 0.7);
      const cosX = Math.cos(angle * 0.4);
      const sinX = Math.sin(angle * 0.4);

      const rotated = pts3d.map(p => {
        // Rotate Y
        const x1 = p.x * cos - p.z * sin;
        const z1 = p.x * sin + p.z * cos;
        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        return { x: x1, y: y2, z: z2 };
      });

      // Draw outer glow ring
      const grad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.2);
      grad.addColorStop(0,   hexToRgba(color, 0.06));
      grad.addColorStop(0.7, hexToRgba(color, 0.03));
      grad.addColorStop(1,   hexToRgba(color, 0));
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw edges
      edges.forEach(([a, b]) => {
        const pA = rotated[a], pB = rotated[b];
        // Depth-based alpha (front edges brighter)
        const avgZ = (pA.z + pB.z) / 2;
        const alpha = 0.15 + (avgZ + 1) * 0.35; // 0.15 to 0.85

        const x1 = cx + pA.x * r, y1 = cy - pA.y * r;
        const x2 = cx + pB.x * r, y2 = cy - pB.y * r;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = hexToRgba(color, alpha);
        ctx.lineWidth   = avgZ > 0 ? 1.2 : 0.6;
        ctx.stroke();
      });

      // Draw vertices
      rotated.forEach(p => {
        const alpha = 0.3 + (p.z + 1) * 0.35;
        const px = cx + p.x * r;
        const py = cy - p.y * r;
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, alpha);
        ctx.fill();
      });

      // Outer circle border
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(color, 0.25);
      ctx.lineWidth   = 0.8;
      ctx.stroke();

      angleRef.current += 0.006;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, color]);

  return (
    <canvas
      ref={canvasRef}
      className="floating-orb"
      style={style}
    />
  );
};

const ORB_CONFIGS = [
  { size: 130, color: '#00e5cc', style: { top: '8%',  left: '10%', animationDelay: '0s',    animationDuration: '8s'  } },
  { size:  90, color: '#3b82f6', style: { top: '15%', left: '28%', animationDelay: '-3s',   animationDuration: '11s' } },
  { size: 110, color: '#ec4899', style: { top: '6%',  right: '12%',animationDelay: '-5s',   animationDuration: '9s'  } },
  { size:  80, color: '#8b5cf6', style: { top: '45%', right: '6%', animationDelay: '-2s',   animationDuration: '12s' } },
  { size:  70, color: '#22c55e', style: { top: '60%', left: '5%',  animationDelay: '-7s',   animationDuration: '10s' } },
  { size:  95, color: '#f59e0b', style: { bottom:'8%',right:'20%', animationDelay: '-4s',   animationDuration: '13s' } },
];

const FloatingOrbs = () => (
  <div className="floating-orbs-container" aria-hidden="true">
    {ORB_CONFIGS.map((cfg, i) => (
      <Orb key={i} size={cfg.size} color={cfg.color} style={cfg.style} />
    ))}
  </div>
);

export default FloatingOrbs;
