import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GithubIcon } from '../../components/ui/icons';
import SocialAuthButtons from '../../components/auth/SocialAuthButtons';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resending, setResending] = useState(false);

  // Already signed in — nothing to do on the register page.
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
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);
    try {
      const created = await register({ name: form.name, email: form.email, password: form.password, role: 'developer' });
      // New accounts start unverified; point them at the inbox until the
      // verification link is clicked (existing/verified users go straight in).
      if (created && created.isVerified === false) {
        setRegistered(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
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

        <h1 className="auth-title">
          {registered ? 'Check your email' : 'Create your account'}
        </h1>
        <p className="auth-subtitle">
          {registered
            ? 'One more step to activate your account.'
            : 'Join GitInsight AI to unlock AI-powered insights'}
        </p>

        {error && (
          <div className="auth-alert auth-alert-error">⚠️ {error}</div>
        )}

        {registered && (
          <div className="auth-alert auth-alert-success">
            <div>
              <strong>Almost done — verify your email.</strong> We sent a
              verification link to <strong>{form.email}</strong>. Click it to
              activate your account, then sign in.
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

        {!registered && <SocialAuthButtons mode="register" />}

        {!registered && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Full Name</label>
            <input type="text" name="name" className="auth-input" placeholder="John Doe" value={form.name} onChange={handleChange} required autoComplete="name" />
          </div>

          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <input type="email" name="email" className="auth-input" placeholder="you@example.com" value={form.email} onChange={handleChange} required autoComplete="email" />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                className="auth-input"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                style={{ paddingRight: '3rem' }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className={`auth-input${form.confirmPassword && form.password !== form.confirmPassword ? ' error' : ''}`}
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <span className="auth-error-text">Passwords do not match</span>
            )}
          </div>

          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : 'Create Account'}
          </button>
        </form>
        )}

        <p className="auth-footer-text">
          {registered ? (
            <>Back to <Link to="/login">sign in</Link></>
          ) : (
            <>Already have an account? <Link to="/login">Sign in</Link></>
          )}
        </p>
      </div>
    </div>
  );
};

export default Register;
