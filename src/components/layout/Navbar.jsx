import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, GitMerge, Trophy, Moon, Sun, ChevronDown, User, LogOut, Banknote } from 'lucide-react';
import { GithubIcon } from '../ui/icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/dashboard/${searchInput.trim()}`);
      setSearchInput('');
    }
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">

        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="brand-logo-wrap">
            <GithubIcon size={20} />
          </div>
          <span className="brand-text">GitInsight <span className="brand-ai">AI</span></span>
        </Link>

        {/* Search */}
        <form className={`navbar-search ${searchFocused ? 'focused' : ''}`} onSubmit={handleSearch}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search any GitHub profile…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="search-input"
          />
          {searchInput && (
            <button type="submit" className="search-go-btn">
              Go →
            </button>
          )}
        </form>

        {/* Actions */}
        <div className="navbar-actions">
          <Link to="/leaderboard" className="nav-link">
            <Trophy size={15} />
            Leaderboards
          </Link>
          <Link to="/compare" className="nav-link">
            <GitMerge size={15} />
            Compare Profiles
          </Link>

          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {user.avatar ? (
                  <img className="user-avatar" src={user.avatar} alt="" />
                ) : (
                  <span className="user-avatar-fallback">
                    {(user.name || 'G').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="user-name">{user.name}</span>
                <ChevronDown size={14} className={`chevron ${menuOpen ? 'open' : ''}`} />
              </button>

              {menuOpen && (
                <div className="user-dropdown" role="menu">
                  <div className="dropdown-header">
                    <div className="dropdown-name">{user.name}</div>
                    <div className="dropdown-email">{user.email}</div>
                  </div>
                  <Link
                    to="/account/profile"
                    className="dropdown-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={16} /> My account
                  </Link>
                  {(user.role === 'super_admin' || user.role === 'company_admin') && (
                    <>
                      <Link
                        to="/admin/payments"
                        className="dropdown-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Banknote size={16} /> Payments
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">
                Sign in
              </Link>
              <Link to="/register" className="navbar-signup-btn">
                Sign up
              </Link>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="navbar-theme-btn"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
