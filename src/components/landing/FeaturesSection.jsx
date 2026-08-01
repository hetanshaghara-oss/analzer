import React from 'react';
import {
  BarChart3, Flame, Shield, Dna, Trophy, GitMerge, Trees,
} from 'lucide-react';
import SpotlightCard from '../ui/SpotlightCard';
import Reveal from './Reveal';
import './FeaturesSection.css';

const FEATURES = [
  {
    icon: BarChart3,
    color: '#6366f1',
    title: 'Advanced Analytics',
    desc: 'Dive deep into stars, forks, language distributions, and growth over time with high-fidelity interactive charts.',
    span: 'bento-span-2 bento-large',
    spotColor: 'rgba(99, 102, 241, 0.18)',
  },
  {
    icon: Flame,
    color: '#f59e0b',
    title: 'Commit Streak',
    desc: 'Real fire-based streak tracker with Duolingo-style milestone badges.',
    span: '',
    spotColor: 'rgba(245, 158, 11, 0.18)',
  },
  {
    icon: Shield,
    color: '#10b981',
    title: 'Security Audit',
    desc: 'License compliance, secret exposure checks, and actionable security health scores.',
    span: 'bento-row-2',
    spotColor: 'rgba(16, 185, 129, 0.18)',
  },
  {
    icon: Dna,
    color: '#8b5cf6',
    title: 'Developer DNA',
    desc: 'Personality type, risk profile, and specialty badges derived from your coding patterns.',
    span: '',
    spotColor: 'rgba(139, 92, 246, 0.18)',
  },
  {
    icon: Trophy,
    color: '#f43f5e',
    title: 'World Rankings',
    desc: 'Global developer leaderboard with podium, rank tiers, and a GitInsight Score.',
    span: '',
    spotColor: 'rgba(244, 63, 94, 0.18)',
  },
  {
    icon: GitMerge,
    color: '#3b82f6',
    title: 'Battle Arena',
    desc: 'Side-by-side epic battle of two developers across every metric with a winner crown.',
    span: '',
    spotColor: 'rgba(59, 130, 246, 0.18)',
  },
  {
    icon: Trees,
    color: '#22c55e',
    title: 'RPG Skill Tree',
    desc: 'Gamified class system — unlock Frontend Mage, Backend Paladin, DevOps Ranger and more.',
    span: 'bento-span-2',
    spotColor: 'rgba(34, 197, 94, 0.18)',
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="features-section">
      <div className="container">
        <Reveal>
          <div className="features-header">
            <p className="features-eyebrow">Everything you need</p>
            <h2 className="features-title">
              A complete arsenal for<br />
              <span className="text-gradient">developer intelligence</span>
            </h2>
            <p className="features-subtitle">
              Every tool you need to deeply understand a developer's true technical capabilities — assembled in one seamless platform.
            </p>
          </div>
        </Reveal>

        <div className="bento-grid">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <Reveal key={feat.title} delay={(i % 3) * 90} className={feat.span}>
                <SpotlightCard className={`bento-cell`} spotlightColor={feat.spotColor}>
                  <div className="bento-content">
                    <div className="bento-icon" style={{ '--icon-color': feat.color }}>
                      <Icon size={26} />
                    </div>
                    <h3 className="bento-title">{feat.title}</h3>
                    <p className="bento-desc">{feat.desc}</p>
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
