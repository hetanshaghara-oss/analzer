import React from 'react';
import { Search, Brain, FileText, ArrowRight } from 'lucide-react';
import Reveal from './Reveal';
import './HowItWorks.css';

const STEPS = [
  {
    icon: Search,
    color: '#6366f1',
    title: 'Enter a username',
    desc: 'Type any GitHub handle into the search bar. No signup, no token, no friction.',
    tag: '01',
  },
  {
    icon: Brain,
    color: '#8b5cf6',
    title: 'The engine analyzes',
    desc: 'Our AI engine parses repos, commits, languages, security signals and contribution rhythm in seconds.',
    tag: '02',
  },
  {
    icon: FileText,
    color: '#10b981',
    title: 'Get the intelligence report',
    desc: 'Unlock skill trees, developer DNA, world rankings and a full security audit — beautifully visualized.',
    tag: '03',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="how-section">
      <div className="container">
        <Reveal>
          <div className="how-header">
            <p className="how-eyebrow">How it works</p>
            <h2 className="how-title">
              Truth in <span className="text-gradient">three steps</span>
            </h2>
            <p className="how-subtitle">
              From a raw GitHub profile to a full intelligence dossier in under ten seconds.
            </p>
          </div>
        </Reveal>

        <div className="how-steps">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.title}>
                <Reveal delay={i * 130} className="how-step-col">
                  <div className="how-card">
                    <div className="how-card-top">
                      <div className="how-icon" style={{ '--step-color': step.color }}>
                        <Icon size={26} />
                      </div>
                      <span className="how-tag">{step.tag}</span>
                    </div>
                    <h3 className="how-card-title">{step.title}</h3>
                    <p className="how-card-desc">{step.desc}</p>
                  </div>
                </Reveal>
                {i < STEPS.length - 1 && (
                  <div className="how-connector" aria-hidden>
                    <ArrowRight size={22} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
