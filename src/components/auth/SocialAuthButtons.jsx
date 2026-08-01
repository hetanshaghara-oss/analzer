import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GithubIcon } from '../ui/icons';
import '../../pages/auth/Auth.css';

const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 36.1 44 30.6 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

const GitlabIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#E24329" d="m12 22.13 4.5-13.23h-9L12 22.13z"/>
    <path fill="#FC6D26" d="m12 22.13-4.5-13.23H4.82L12 22.13z"/>
    <path fill="#FCA326" d="m4.82 8.9-1.83 5.63a.84.84 0 0 0 .3.94L12 22.13 4.82 8.9z"/>
    <path fill="#E24329" d="M4.82 8.9h6.68L9.9 3.27a.41.41 0 0 0-.4-.27.42.42 0 0 0-.41.27L4.82 8.9z"/>
    <path fill="#FC6D26" d="M19.18 8.9l1.83 5.63a.84.84 0 0 1-.3.94L12 22.13l7.18-13.23z"/>
    <path fill="#FCA326" d="M19.18 8.9h-6.68l1.6-5.63a.4.4 0 0 1 .4-.27.43.43 0 0 1 .41.27l1.83 5.63h2.44z"/>
  </svg>
);

const PROVIDERS = {
  github: { label: 'GitHub', Icon: GithubIcon, className: 'social-btn--github' },
  google: { label: 'Google', Icon: GoogleIcon, className: 'social-btn--google' },
  gitlab: { label: 'GitLab', Icon: GitlabIcon, className: 'social-btn--gitlab' },
};

/**
 * Renders "Continue with …" buttons for every OAuth provider the backend has
 * credentials for (fetched from /api/auth/oauth/providers). Unconfigured
 * providers are not shown, so every visible button actually works.
 */
const SocialAuthButtons = ({ mode = 'login' }) => {
  const { loginWithProvider } = useAuth();
  const location = useLocation();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/oauth/providers')
      .then((res) => (res.ok ? res.json() : { providers: [] }))
      .then((data) => { if (active) setProviders(data.providers || []); })
      .catch(() => { if (active) setProviders([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading || providers.length === 0) return null;

  const handleProvider = (id) => {
    // Preserve the page the user was heading to (e.g. a protected route).
    const from =
      location.pathname === '/login' && location.state?.from?.pathname
        ? location.state.from.pathname
        : `${window.location.pathname}${window.location.search}`;
    loginWithProvider(id, from);
  };

  return (
    <div className="social-auth">
      {providers.map((id) => {
        const meta = PROVIDERS[id];
        if (!meta) return null;
        const { label, Icon, className } = meta;
        return (
          <button
            key={id}
            type="button"
            className={`social-btn ${className}`}
            onClick={() => handleProvider(id)}
          >
            <span className="social-btn-icon"><Icon /></span>
            <span className="social-btn-label">
              {mode === 'register' ? 'Sign up' : 'Continue'} with {label}
            </span>
          </button>
        );
      })}
      <div className="auth-divider">
        {mode === 'register' ? 'or sign up with email' : 'or continue with email'}
      </div>
    </div>
  );
};

export default SocialAuthButtons;
