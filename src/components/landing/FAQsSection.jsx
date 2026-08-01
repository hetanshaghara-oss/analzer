import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Reveal from './Reveal';
import './FAQsSection.css';

const FAQS = [
  {
    q: 'Do I need an account or API token to analyze a profile?',
    a: 'No. Just type any public GitHub username and hit Analyze. GitInsight works instantly for every public profile — no signup, no token, no credit card.',
  },
  {
    q: 'How does the GitInsight Score work?',
    a: 'The score is a weighted blend of contribution consistency, repository health, language breadth, open-source impact, and security posture. The exact weights are proprietary, but you can always dig into every underlying metric in the analytics tab.',
  },
  {
    q: 'What exactly does the security audit check?',
    a: 'It scans your public repos for license compliance, accidentally committed secrets and API keys, dependency risk signals, and stale branches. Each finding comes with an actionable recommendation and a health score.',
  },
  {
    q: 'Can I compare two developers side by side?',
    a: 'Yes — open the Battle Arena from any profile or the Compare page and pick any two usernames. You get a metric-by-metric breakdown with a winner crown on the GitInsight Score.',
  },
  {
    q: 'Is my data private?',
    a: 'We only ever read public GitHub data. We never store your raw profile data or your LinkedIn upload server-side — the CSV is parsed in your browser and only used to enrich your current session.',
  },
  {
    q: 'Do you support private repositories or organizations?',
    a: 'The free tier covers public profiles. Pro adds private-org analysis through a scoped token you control, plus batch CSV import for recruiters reviewing many candidates.',
  },
];

const FAQItem = ({ item, index, open, onToggle }) => (
  <div className={`faq-item ${open ? 'faq-item--open' : ''}`}>
    <button className="faq-question" onClick={onToggle} aria-expanded={open}>
      <span className="faq-q-text">
        <span className="faq-index">{String(index + 1).padStart(2, '0')}</span>
        {item.q}
      </span>
      <span className={`faq-chevron ${open ? 'faq-chevron--open' : ''}`}>
        <ChevronDown size={18} />
      </span>
    </button>
    <div className="faq-answer">
      <div className="faq-answer-inner">
        <p>{item.a}</p>
      </div>
    </div>
  </div>
);

const FAQsSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="faq-section">
      <div className="container">
        <div className="faq-layout">
          <Reveal direction="left">
            <div className="faq-intro">
              <p className="faq-eyebrow">FAQ</p>
              <h2 className="faq-title">
                Questions? <span className="text-gradient">Answered.</span>
              </h2>
              <p className="faq-subtitle">
                Everything you might want to know about GitInsight. Still curious? Drop us a line anytime.
              </p>
            </div>
          </Reveal>

          <Reveal direction="right" delay={80}>
            <div className="faq-list">
              {FAQS.map((item, i) => (
                <FAQItem
                  key={item.q}
                  item={item}
                  index={i}
                  open={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default FAQsSection;
