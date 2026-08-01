import React from 'react';
import { Link } from 'react-router-dom';
import { GithubIcon, TwitterIcon, LinkedinIcon } from '../ui/icons';
import { Heart, GitMerge } from 'lucide-react';
import './LandingFooter.css';

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Compare', href: '/compare' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Leaderboards', href: '/leaderboard' },
      { label: 'Developer DNA', href: '#features' },
      { label: 'Security audit', href: '#features' },
      { label: 'Wrapped', href: '#features' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#top' },
      { label: 'Blog', href: '#top' },
      { label: 'Careers', href: '#top' },
      { label: 'Contact', href: '#top' },
    ],
  },
];

const smoothScroll = (e, href) => {
  if (!href.startsWith('#')) return;
  e.preventDefault();
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const LandingFooter = () => (
  <footer className="landing-footer">
    <div className="container landing-footer-inner">
      <div className="landing-footer-brand">
        <Link to="/" className="landing-footer-logo">
          <GithubIcon size={18} />
        </Link>
        <span className="landing-footer-name">GitInsight <em>AI</em></span>
        <p className="landing-footer-tagline">
          The most advanced GitHub developer intelligence platform. Beautiful analytics, powered by the real GitHub API.
        </p>
        <div className="landing-footer-socials">
          <a href="#top" aria-label="GitHub" onClick={(e) => smoothScroll(e, '#top')}>
            <GithubIcon size={18} />
          </a>
          <a href="#top" aria-label="Twitter / X" onClick={(e) => smoothScroll(e, '#top')}>
            <TwitterIcon size={18} />
          </a>
          <a href="#top" aria-label="LinkedIn" onClick={(e) => smoothScroll(e, '#top')}>
            <LinkedinIcon size={18} />
          </a>
        </div>
      </div>

      {COLUMNS.map((col) => (
        <nav className="landing-footer-col" key={col.heading}>
          <span className="landing-footer-col-heading">{col.heading}</span>
          {col.links.map((link) => (
            link.href.startsWith('#') ? (
              <a
                key={link.label}
                href={link.href}
                className="landing-footer-link"
                onClick={(e) => smoothScroll(e, link.href)}
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.href} className="landing-footer-link">
                {link.label}
              </Link>
            )
          ))}
        </nav>
      ))}
    </div>

    <div className="landing-footer-bottom">
      <div className="container landing-footer-bottom-inner">
        <span>GitInsight AI © {new Date().getFullYear()}</span>
        <span className="landing-footer-heart">
          Made with <Heart size={13} className="landing-footer-heart-icon" /> for developers
        </span>
        <Link to="/compare" className="landing-footer-compare">
          <GitMerge size={13} /> Battle Arena
        </Link>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
