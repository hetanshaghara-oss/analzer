import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GithubIcon } from '../../components/ui/icons';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import './Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token and can\'t be used.');
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'This verification link is invalid or has expired.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not reach the server. Please try again in a moment.');
      });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon">
            <GithubIcon size={18} />
          </div>
          <span className="auth-logo-text">GitInsight <span>AI</span></span>
        </Link>

        <h1 className="auth-title">
          {status === 'loading' ? 'Verifying your email' : status === 'success' ? 'Email verified' : 'Verification failed'}
        </h1>

        <div className="auth-verify-body">
          {status === 'loading' && (
            <>
              <Loader2 size={28} className="animate-spin" />
              <p className="auth-subtitle">Please wait a moment…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 size={40} className="auth-verify-icon success" />
              <p className="auth-subtitle">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={40} className="auth-verify-icon error" />
              <p className="auth-subtitle">{message}</p>
              <p className="auth-subtitle">
                You can request a new link from the{' '}
                <Link to="/login" style={{ color: 'var(--accent-primary)' }}>sign in</Link> page.
              </p>
            </>
          )}
        </div>

        <Link to="/login" className="auth-btn auth-btn-primary" style={{ textAlign: 'center' }}>
          Go to sign in
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
