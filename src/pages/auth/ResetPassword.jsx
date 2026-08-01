import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { GithubIcon } from '../../components/ui/icons';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Invalid Reset Link</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>This password reset link is missing or invalid.</p>
          <Link to="/forgot-password" className="auth-btn auth-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <GithubIcon size={28} style={{ color: 'var(--accent-primary)' }} />
          <span className="auth-logo-text">GitInsight<span>AI</span></span>
        </Link>

        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">Choose a strong password for your account</p>

        {error && <div className="auth-alert auth-alert-error">⚠️ {error}</div>}
        {message && <div className="auth-alert auth-alert-success">✅ {message} Redirecting to login...</div>}

        {!message && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} className="auth-input" placeholder="At least 8 characters"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required style={{ paddingRight: '3rem' }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirm New Password</label>
              <input type="password" className={`auth-input${form.confirmPassword && form.password !== form.confirmPassword ? ' error' : ''}`}
                placeholder="Repeat your new password"
                value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <span className="auth-error-text">Passwords do not match</span>
              )}
            </div>
            <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Updating...</> : 'Update Password'}
            </button>
          </form>
        )}

        <p className="auth-footer-text">
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowLeft size={14} /> Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
