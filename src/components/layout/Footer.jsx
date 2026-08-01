import React from 'react';
import { Link } from 'react-router-dom';
import { GithubIcon } from '../ui/icons';
import { Heart, GitMerge, BarChart3, Shield, Flame } from 'lucide-react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container footer-inner">

      <div className="footer-brand">
        <div className="footer-logo">
          <GithubIcon size={18} />
        </div>
        <span className="footer-brand-text">GitInsight <span>AI</span></span>
        <p className="footer-tagline">
          Beautiful GitHub profile analytics, powered by the real GitHub API.
        </p>
      </div>

      <nav className="footer-links">
        <span className="footer-links-label">Explore</span>
        <Link to="/" className="footer-link">Home</Link>
        <Link to="/compare" className="footer-link"><GitMerge size={13} /> Compare</Link>
      </nav>

      <nav className="footer-links">
        <span className="footer-links-label">Modules</span>
        <span className="footer-link static"><BarChart3 size={13} /> Analytics</span>
        <span className="footer-link static"><Flame size={13} /> Commit Rhythm</span>
        <span className="footer-link static"><Shield size={13} /> Security Audit</span>
      </nav>

    </div>

    <div className="footer-bottom">
      <div className="container footer-bottom-inner">
        <span>GitInsight AI © {new Date().getFullYear()}</span>
        <span className="footer-heart">
          Made with <Heart size={13} className="heart-icon" /> for developers
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
