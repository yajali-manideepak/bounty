import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserPlus, Shield, ArrowRight } from 'lucide-react';

export default function RegisterPage({ onNavigate, onRegisterSuccess }) {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('REPORTER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8 || password.length > 16) {
      setError('Password must be between 8 and 16 characters long.');
      return;
    }

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    if (!hasLetters || !hasNumbers) {
      setError('Password must be a combination of both letters and numbers.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const cleanEmail = email.trim().toLowerCase();
      const res = await register({ name, email: cleanEmail, password, role });
      showToast('Registration successful! Please sign in with your registered credentials.', 'success');
      if (onRegisterSuccess) onRegisterSuccess(cleanEmail);
    } catch (err) {
      setError(err.message || 'Registration failed.');
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '480px', marginTop: '2rem' }}>
      <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}
          >
            <UserPlus size={24} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create Account</h2>
          <p style={{ fontSize: '0.875rem' }}>Join BugHunt Pro vulnerability platform</p>
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name *</label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password (8-16 characters) *</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={16}
              required
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Must be 8 to 16 characters with a combination of letters and numbers.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Platform Role</label>
            <select
              id="role"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="REPORTER">Reporter (Standard Bug Reporting)</option>
              <option value="DEVELOPER">Developer (Fixes and Status Updates)</option>
              <option value="SECURITY_RESEARCHER">Security Researcher (Vulnerability Research)</option>
            </select>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Note: Admin accounts are managed privately and cannot be registered publicly.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
          >
            {submitting ? 'Creating Account...' : (
              <>Register Account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-dim)' }}>Already registered? </span>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
