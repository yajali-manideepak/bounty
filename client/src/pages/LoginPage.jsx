import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogIn, Shield, ArrowRight } from 'lucide-react';

export default function LoginPage({ onNavigate, onLoginSuccess, initialEmail = '' }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await login(email.trim().toLowerCase(), password);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
      showToast(err.message || 'Login failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFill = (fillEmail, fillPass) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError('');
  };

  return (
    <div className="app-container" style={{ maxWidth: '460px', marginTop: '2rem' }}>
      <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}
          >
            <Shield size={24} color="#6366f1" />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Sign In</h2>
          <p style={{ fontSize: '0.875rem' }}>Access your BugHunt Pro dashboard</p>
        </div>

        {initialEmail && !error && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}
          >
            Registration successful! Please enter your password to sign in.
          </div>
        )}

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={!initialEmail}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password *</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus={Boolean(initialEmail)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
          >
            {submitting ? 'Authenticating...' : (
              <>Sign In <LogIn size={16} /></>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-dim)' }}>Need an account? </span>
          <button
            type="button"
            onClick={() => onNavigate('register')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
          >
            Create one
          </button>
        </div>

        {/* Quick Demo Credentials */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
            Quick Demo Accounts (Click to Fill):
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleFill('admin@bughunt.local', 'AdminPass123!')}
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              🔴 Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleFill('dev1@bughunt.local', 'DevPass123!')}
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              🟣 Dev Alex
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleFill('reporter1@bughunt.local', 'ReporterPass123!')}
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              🟢 Reporter
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleFill('sec1@bughunt.local', 'SecPass123!')}
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              🔵 Researcher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
