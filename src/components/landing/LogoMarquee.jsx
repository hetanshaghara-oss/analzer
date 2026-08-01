import React from 'react';
import { Star } from 'lucide-react';
import './LogoMarquee.css';

const NAMES = [
  'torvalds', 'gaearon', 'sindresorhus', 'yyx990803', 'addyosmani',
  'tj', 'kentcdodds', 'defunkt', 'cassidoo', 'thepracticaldev',
  'danielroe', 'vjeux', 'acdlite', 'sophiebits', 'devongovett',
];

const LogoMarquee = () => {
  const row = [...NAMES, ...NAMES];

  return (
    <section className="marquee-section">
      <p className="marquee-eyebrow">Tracked across GitHub — a tiny sample of the developers we analyze</p>
      <div className="marquee-track">
        <div className="marquee-row">
          {row.map((name, i) => (
            <span className="marquee-chip" key={i} aria-hidden={i >= NAMES.length}>
              <span className="marquee-avatar">{name[0].toUpperCase()}</span>
              @{name}
              <Star size={11} className="marquee-star" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoMarquee;
