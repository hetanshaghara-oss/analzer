import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GithubIcon } from '../../components/ui/icons';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import './Auth.css';

/**
 * Landing page for OAuth sign-in redirects. The backend swaps a one-time code
 * for a real session via POST /api/auth/oauth/exchange — no tokens in the URL.
 */
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeOAuthCode } = useAuth();
  const code = searchParams.get('code');
  const provider = searchParams.get('provider') || '';
  const queryError = searchParams.get('error');
  const ran = useRef(false);

  const [status, setStatus] = useState(queryError ? 'error' : 'loading');
  const [message, setMessage] = useState(queryError || '');

  useEffect(() => {
    if (ran.current) return;
    if (queryError) {
      setStatus('error');
      setMessage(queryError.replace(/\+/g, ' '));
      return;
    }
    if (!code) {
      setStatus('error');
      setMessage('Missing sign-in code. Please try again.');
      return;
    }
    ran.current = true;

    exchangeOAuthCode(code)
      .then(() => {
        setStatus('success');
        const from = sessionStorage.getItem('oauth_from');
        sessionStorage.removeItem('oauth_from');
        const target =
          from && !['/login', '/register', '/oauth/callback'].includes(from)
            ? from
            : '/';
        setTimeout(() => navigate(target, { replace: true }), 900);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'OAuth sign-in failed. Please try again.');
      });
  }, [code, queryError, exchangeOAuthCode, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--center">
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon">
            <GithubIcon size={18} />
          </div>
          <span className="auth-logo-text">GitInsight <span>AI</span></span>
        </Link>

        {status === 'loading' && (
          <div className="oauth-status">
            <Loader2 size={30} className="animate-spin" />
            <h1 className="auth-title">
              Signing you in{provider ? ` with ${provider}` : ''}…
            </h1>
            <p className="auth-subtitle">
              One moment while we securely link your account.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="oauth-status">
            <CheckCircle2 size={34} style={{ color: '#16a34a' }} />
            <h1 className="auth-title">You&apos;re signed in!</h1>
            <p className="auth-subtitle">Taking you to your dashboard…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="oauth-status">
            <AlertTriangle size={34} style={{ color: '#dc2626' }} />
            <h1 className="auth-title">Sign-in failed</h1>
            <div className="auth-alert auth-alert-error">{message}</div>
            <Link
              to="/login"
              className="auth-btn auth-btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
