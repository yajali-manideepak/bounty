import React, { useState, useEffect } from 'react';
import { Shield, Bug, ArrowRight, CheckCircle2, UserCheck, Lock, Activity, Sparkles } from 'lucide-react';

export default function LandingPage({ onNavigate, onDemoLogin }) {
  const [health, setHealth] = useState({ status: 'checking', database: 'unknown' });

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(() => setHealth({ status: 'offline', database: 'disconnected' }));
  }, []);

  return (
    <div className="app-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* System Status Pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.35rem 1rem',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '9999px',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: '0.8125rem'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: health.status === 'ok' ? '#10b981' : '#f59e0b' }} />
          <span style={{ color: 'var(--text-muted)' }}>Engine Status:</span>
          <strong style={{ color: health.status === 'ok' ? '#10b981' : '#f59e0b' }}>
            {health.status === 'ok' ? 'Online & Ready (SQLite Connected)' : 'Offline'}
          </strong>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 4rem auto' }}>
        {/* Prominent Developed by Stella Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.55rem 1.4rem',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(236, 72, 153, 0.25))',
              border: '1px solid rgba(192, 132, 252, 0.5)',
              borderRadius: '9999px',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.35)',
              backdropFilter: 'blur(10px)',
              animation: 'pulse 3s infinite'
            }}
          >
            <Sparkles size={18} color="#c084fc" />
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: '800',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #a5b4fc, #c084fc, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'var(--font-sans)'
              }}
            >
              Developed by Stella
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '9999px',
                color: '#f8fafc',
                fontWeight: '600'
              }}
            >
              Official Edition
            </span>
          </div>
        </div>

        <h1 style={{ fontSize: '3.25rem', lineHeight: '1.15', marginBottom: '1.25rem', fontWeight: '800' }}>
          Defend, Track, and Resolve Bugs with <span style={{ color: 'var(--primary)' }}>Zero Ambiguity</span>
        </h1>
        <p style={{ fontSize: '1.1875rem', lineHeight: '1.6', marginBottom: '2rem', color: 'var(--text-muted)' }}>
          A secure, end-to-end bug bounty and vulnerability tracking system. Built with strict role-based access control, enforced verification state machines, and real-time audit trail visibility.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}
            onClick={() => onNavigate('login')}
          >
            Sign In to Platform <ArrowRight size={18} />
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}
            onClick={() => onNavigate('register')}
          >
            Create New Account
          </button>
        </div>
      </div>

      {/* Instant 1-Click Role Exploration */}
      <div className="glass-card" style={{ maxWidth: '960px', margin: '0 auto 4rem auto', padding: '2rem' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
          ⚡ 1-Click Role Switcher Demo
        </h3>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          Experience BugHunt Pro from any persona instantly without typing credentials:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flexDirection: 'column', padding: '1rem', alignItems: 'flex-start', textAlign: 'left', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onClick={() => onDemoLogin('admin@bughunt.local', 'AdminPass123!')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Shield size={16} color="#ef4444" />
              <strong style={{ color: '#ef4444' }}>System Admin</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Assign devs, manage users, full audit logs</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ flexDirection: 'column', padding: '1rem', alignItems: 'flex-start', textAlign: 'left', borderColor: 'rgba(139, 92, 246, 0.3)' }}
            onClick={() => onDemoLogin('dev1@bughunt.local', 'DevPass123!')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <UserCheck size={16} color="#a78bfa" />
              <strong style={{ color: '#a78bfa' }}>Developer (Alex)</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>View assigned bugs, update fix status, comments</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ flexDirection: 'column', padding: '1rem', alignItems: 'flex-start', textAlign: 'left', borderColor: 'rgba(16, 185, 129, 0.3)' }}
            onClick={() => onDemoLogin('reporter1@bughunt.local', 'ReporterPass123!')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Bug size={16} color="#10b981" />
              <strong style={{ color: '#10b981' }}>Reporter (Riley)</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Submit reports, verify resolutions, close bugs</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ flexDirection: 'column', padding: '1rem', alignItems: 'flex-start', textAlign: 'left', borderColor: 'rgba(6, 182, 212, 0.3)' }}
            onClick={() => onDemoLogin('sec1@bughunt.local', 'SecPass123!')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Lock size={16} color="#06b6d4" />
              <strong style={{ color: '#06b6d4' }}>Researcher (Sam)</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Report vulnerabilities, track triage process</span>
          </button>
        </div>
      </div>

      {/* Complete Real-World Lifecycle Pipeline */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Strict Bug Resolution Lifecycle</h2>
        <p style={{ maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
          State machine enforced: no arbitrary status skips. Every transition records an immutable audit log entry.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {[
            { step: '1', title: 'OPEN', desc: 'Reporter files report', color: '#3b82f6' },
            { step: '2', title: 'ASSIGNED', desc: 'Admin assigns dev', color: '#8b5cf6' },
            { step: '3', title: 'IN PROGRESS', desc: 'Dev begins fix', color: '#f59e0b' },
            { step: '4', title: 'FIXED', desc: 'Dev deploys patch', color: '#10b981' },
            { step: '5', title: 'VERIFY', desc: 'Reporter validates fix', color: '#06b6d4' },
            { step: '6', title: 'CLOSED', desc: 'Resolved or archived', color: '#64748b' },
          ].map((item, idx) => (
            <div
              key={item.title}
              className="glass-card"
              style={{ padding: '1.25rem 0.75rem', textAlign: 'center', borderTop: `3px solid ${item.color}` }}
            >
              <span style={{
                display: 'inline-block',
                width: '24px',
                height: '24px',
                lineHeight: '24px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                fontSize: '0.75rem',
                fontWeight: '700',
                marginBottom: '0.5rem'
              }}>
                {item.step}
              </span>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', color: item.color, marginBottom: '0.25rem' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
