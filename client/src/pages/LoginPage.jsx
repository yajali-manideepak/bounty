import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { LogIn, Shield, KeyRound, ArrowLeft } from 'lucide-react';

export default function LoginPage({ onNavigate, onLoginSuccess, initialEmail = '' }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password / Reset state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState(initialEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setResetEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleOpenReset = () => {
    setIsResetMode(true);
    setResetEmail(email.trim() || initialEmail || '');
    setError('');
  };

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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const targetEmail = resetEmail.trim().toLowerCase();

    if (!targetEmail || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      setError('Password must be between 8 and 16 characters long.');
      return;
    }

    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /[0-9]/.test(newPassword);
    if (!hasLetters || !hasNumbers) {
      setError('Password must be a combination of both letters and numbers.');
      return;
    }

    try {
      setResetting(true);
      setError('');
      const res = await api.resetPassword({
        email: targetEmail,
        newPassword
      });
      showToast(res.message || 'Password reset successfully! Please sign in with your new password.', 'success');
      setEmail(targetEmail);
      setPassword('');
      setIsResetMode(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
      showToast(err.message || 'Failed to reset password.', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleFill = (fillEmail, fillPass) => {
    setEmail(fillEmail);
    setResetEmail(fillEmail);
    setPassword(fillPass);
    setError('');
  };

  return (
    <div className="app-container" style={{ maxWidth: '460px', marginTop: '2rem' }}>
      <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
        {isResetMode ? (
          // -------------------------------------------------------------
          // FORGOT / RESET PASSWORD VIEW
          // -------------------------------------------------------------
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}
              >
                <KeyRound size={24} color="#f59e0b" />
              </div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Set New Password</h2>
              <p style={{ fontSize: '0.875rem' }}>Enter your registered email and choose a new password</p>
            </div>

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

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="resetEmail">Registered Email Address *</label>
                <input
                  id="resetEmail"
                  type="email"
                  className="form-input"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoFocus={!resetEmail}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">New Password (8-16 characters) *</label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  maxLength={16}
                  required
                  autoFocus={Boolean(resetEmail)}
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Must be 8 to 16 characters with a combination of letters and numbers.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm New Password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  maxLength={16}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={resetting}
                style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
              >
                {resetting ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setError('');
                }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          // -------------------------------------------------------------
          // SIGN IN VIEW
          // -------------------------------------------------------------
          <div>
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
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  textAlign: 'left'
                }}
              >
                <div>{error}</div>
                <button
                  type="button"
                  onClick={handleOpenReset}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#ffffff',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    width: 'fit-content'
                  }}
                >
                  <KeyRound size={14} /> Forgot your password? Click here to set a new password →
                </button>
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setResetEmail(e.target.value);
                  }}
                  required
                  autoFocus={!initialEmail}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password *</label>
                  <button
                    type="button"
                    onClick={handleOpenReset}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
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
        )}
      </div>
    </div>
  );
}
