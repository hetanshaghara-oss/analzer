import React from 'react';
import { Star, Quote } from 'lucide-react';
import Reveal from './Reveal';
import './TestimonialsSection.css';

const TESTIMONIALS = [
  {
    quote: 'GitInsight replaced an entire afternoon of manual GitHub spelunking. The skill tree alone is worth it — it instantly shows what a candidate actually ships.',
    name: 'Amara Okafor',
    role: 'Technical Recruiter',
    color: '#6366f1',
    featured: true,
  },
  {
    quote: 'I sent my GitInsight report to my mentor. Ten minutes later we were planning my next 6 months. It genuinely knows my strengths better than I do.',
    name: 'Diego Fernández',
    role: 'Frontend Engineer',
    color: '#8b5cf6',
  },
  {
    quote: 'The battle arena is how we settle arguments on the team now. It is absurdly fun and somehow completely accurate.',
    name: 'Priya Sharma',
    role: 'Engineering Manager',
    color: '#10b981',
  },
  {
    quote: 'As a hiring manager I screen 40+ candidates a month. GitInsight’s security audit catches red flags I used to miss entirely.',
    name: 'Marcus Reid',
    role: 'Hiring Manager',
    color: '#f59e0b',
  },
  {
    quote: 'The Developer DNA report nailed my profile — risk-taker, systems thinker, night owl commits. Scary good.',
    name: 'Hannah Lee',
    role: 'Backend Developer',
    color: '#f43f5e',
  },
  {
    quote: 'The Wrapped is my favorite thing on the internet this year. My whole team compares rankings like it is sports.',
    name: 'Omar Al-Farsi',
    role: 'Open Source Maintainer',
    color: '#3b82f6',
  },
];

const Stars = () => (
  <div className="testimonial-stars" aria-label="5 out of 5 stars">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={14} />
    ))}
  </div>
);

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="testimonials-section">
      <div className="container">
        <Reveal>
          <div className="testimonials-header">
            <p className="testimonials-eyebrow">Loved by developers</p>
            <h2 className="testimonials-title">
              Trusted by engineers <span className="text-gradient">& the people who hire them</span>
            </h2>
          </div>
        </Reveal>

        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 100} className={t.featured ? 'testimonial-featured' : ''}>
              <figure className={`testimonial-card ${t.featured ? 'testimonial-card--featured' : ''}`}>
                <Quote size={22} className="testimonial-quote-mark" />
                <Stars />
                <blockquote className="testimonial-quote">{t.quote}</blockquote>
                <figcaption className="testimonial-person">
                  <span className="testimonial-avatar" style={{ '--avatar-color': t.color }}>
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                  <span className="testimonial-meta">
                    <b>{t.name}</b>
                    <em>{t.role}</em>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
