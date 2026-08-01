import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight, Moon, Sun } from 'lucide-react';
import { GithubIcon } from '../ui/icons';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './LandingNav.css';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Stats', href: '#stats' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Pricing', href: '#pricing' },
];

const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = useScrollProgress();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <header className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''} ${menuOpen ? 'landing-nav--open' : ''}`}>
      <div className="landing-nav-progress" style={{ transform: `scaleX(${progress})` }} />

      <div className="container landing-nav-inner">
        <a
          href="#top"
          className="landing-nav-brand"
          onClick={(e) => scrollTo(e, '#top')}
          aria-label="GitInsight AI — back to top"
        >
          <span className="landing-nav-logo">
            <GithubIcon size={18} />
          </span>
          <span className="landing-nav-name">
            GitInsight <em>AI</em>
          </span>
        </a>

        <nav className="landing-nav-links" aria-label="Primary">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="landing-nav-link" onClick={(e) => scrollTo(e, link.href)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-nav-actions">
          <button
            onClick={toggleTheme}
            className="landing-nav-theme-btn"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <Link to="/account/profile" className="landing-nav-ghost landing-nav-user" title="Your account">
              {user.avatar ? (
                <img className="landing-nav-avatar" src={user.avatar} alt="" />
              ) : (
                <span className="landing-nav-avatar landing-nav-avatar--init">
                  {(user.name || 'G').charAt(0).toUpperCase()}
                </span>
              )}
              <span className="landing-nav-user-name">{user.name}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="landing-nav-ghost">
                Sign in
              </Link>
              <Link to="/register" className="landing-nav-ghost landing-nav-signup">
                Sign up
              </Link>
            </>
          )}
          <Link to="/compare" className="landing-nav-ghost">
            Compare
          </Link>
          <a href="#analyze" className="landing-nav-cta" onClick={(e) => scrollTo(e, '#analyze')}>
            Analyze a profile
            <ArrowRight size={15} />
          </a>
          <button
            className="landing-nav-burger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="landing-nav-mobile">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="landing-nav-mobile-link" onClick={(e) => scrollTo(e, link.href)}>
              {link.label}
            </a>
          ))}
          <Link to="/compare" className="landing-nav-mobile-link" onClick={() => setMenuOpen(false)}>
            Compare profiles
          </Link>
          {user ? (
            <Link to="/account/profile" className="landing-nav-mobile-link" onClick={() => setMenuOpen(false)}>
              My account
            </Link>
          ) : (
            <>
              <Link to="/login" className="landing-nav-mobile-link" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
              <Link to="/register" className="landing-nav-mobile-cta" onClick={() => setMenuOpen(false)}>
                Sign up free <ArrowRight size={15} />
              </Link>
            </>
          )}
          <a href="#analyze" className="landing-nav-mobile-cta" onClick={(e) => scrollTo(e, '#analyze')}>
            Analyze a profile <ArrowRight size={15} />
          </a>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
