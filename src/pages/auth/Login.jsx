import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GithubIcon } from '../../components/ui/icons';
import SocialAuthButtons from '../../components/auth/SocialAuthButtons';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyNotice, setVerifyNotice] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resending, setResending] = useState(false);

  // Already signed in — nothing to do on the login page.
  if (authLoading) {
    return (
      <div className="auth-page">
        <div
          className="auth-card"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '12rem' }}
        >
          <Loader2 size={24} className="animate-spin" />
        </div>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVerifyNotice(false);
    setResendMsg('');
    setLoading(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setVerifyNotice(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!form.email) return;
    setResending(true);
    setResendMsg('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json().catch(() => ({}));
      setResendMsg(data.message || 'Verification email sent.');
    } catch {
      setResendMsg('Could not send the verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon">
            <GithubIcon size={18} />
          </div>
          <span className="auth-logo-text">GitInsight <span>AI</span></span>
        </Link>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {error && (
          <div className="auth-alert auth-alert-error">
            ⚠️ {error}
          </div>
        )}

        {verifyNotice && (
          <div className="auth-alert auth-alert-error">
            <div>
              <strong>Email not verified yet.</strong> Check your inbox for the
              verification link we sent when you registered, or request a new one below.
              <button
                type="button"
                className="auth-resend-btn"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
              {resendMsg && <span className="auth-resend-msg">{resendMsg}</span>}
            </div>
          </div>
        )}

        <SocialAuthButtons mode="login" />

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="auth-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="auth-label">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                className="auth-input"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account? <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
