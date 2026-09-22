import React from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { Shield, Bug, PlusCircle, LayoutDashboard, History, LogOut, LogIn, UserPlus } from 'lucide-react';

export default function Navbar({ currentRoute, onNavigate, onSelectBug }) {
  const { user, logout } = useAuth();

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'DEVELOPER':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)' };
      case 'SECURITY_RESEARCHER':
        return { bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)' };
      case 'REPORTER':
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
  };

  return (
    <nav className="navbar">
      <div
        className="brand"
        onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
      >
        <Shield size={26} color="#6366f1" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', lineHeight: '1.2' }}>
            <span>BugHunt<span style={{ color: 'var(--primary)' }}>Pro</span></span>
            <span className="brand-badge">ENTERPRISE</span>
          </div>
          <span style={{ fontSize: '0.6875rem', fontWeight: '600', color: 'var(--text-dim)', marginTop: '2px' }}>
            Developed by <strong style={{ color: '#c084fc', letterSpacing: '0.03em' }}>Stella</strong>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <>
            <div className="nav-links">
              <button
                type="button"
                className={`nav-link ${currentRoute === 'dashboard' ? 'active' : ''}`}
                onClick={() => onNavigate('dashboard')}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <LayoutDashboard size={16} /> Dashboard
              </button>

              <button
                type="button"
                className={`nav-link ${currentRoute === 'bugs' ? 'active' : ''}`}
                onClick={() => onNavigate('bugs')}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Bug size={16} /> Bug Reports
              </button>

              {(user.role === 'REPORTER' || user.role === 'SECURITY_RESEARCHER' || user.role === 'ADMIN') && (
                <button
                  type="button"
                  className={`nav-link ${currentRoute === 'report' ? 'active' : ''}`}
                  onClick={() => onNavigate('report')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <PlusCircle size={16} /> Report Bug
                </button>
              )}

              {user.role === 'ADMIN' && (
                <button
                  type="button"
                  className={`nav-link ${currentRoute === 'audit-logs' ? 'active' : ''}`}
                  onClick={() => onNavigate('audit-logs')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <History size={16} /> Audit Logs
                </button>
              )}
            </div>

            {/* In-app Notification dropdown */}
            <NotificationDropdown onSelectBug={onSelectBug} />

            {/* User Profile & Role Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.35rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#fff' }}>
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    borderRadius: '4px',
                    padding: '0.1rem 0.35rem',
                    display: 'inline-block',
                    alignSelf: 'flex-end',
                    marginTop: '2px',
                    ...getRoleBadgeStyle(user.role)
                  }}
                >
                  {user.role}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Log out"
                style={{ padding: '0.35rem 0.55rem' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('login')}
            >
              <LogIn size={15} /> Sign In
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate('register')}
            >
              <UserPlus size={15} /> Register
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
