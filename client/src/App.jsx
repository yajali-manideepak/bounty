import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BugListPage from './pages/BugListPage';
import BugReportPage from './pages/BugReportPage';
import BugDetailPage from './pages/BugDetailPage';
import AuditLogsPage from './pages/AuditLogsPage';
import './App.css';

function MainApp() {
  const { user, loading, login } = useAuth();
  const { showToast } = useToast();

  const [route, setRoute] = useState('landing');
  const [selectedBugId, setSelectedBugId] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Sync route based on auth status
  useEffect(() => {
    if (!loading) {
      if (user && (route === 'landing' || route === 'login' || route === 'register')) {
        setRoute('dashboard');
      } else if (!user && (route === 'dashboard' || route === 'report' || route === 'audit-logs')) {
        setRoute('login');
      }
    }
  }, [user, loading]);

  const handleNavigate = (newRoute) => {
    setSelectedBugId(null);
    if (newRoute !== 'login') {
      setRegisteredEmail('');
    }
    setRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBug = (id) => {
    setSelectedBugId(id);
    setRoute('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDemoLogin = async (email, password) => {
    try {
      await login(email, password);
      showToast('Logged in successfully!', 'success');
      setRoute('dashboard');
    } catch (err) {
      showToast(err.message || 'Demo login failed.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        Initializing BugHunt Pro...
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentRoute={route}
        onNavigate={handleNavigate}
        onSelectBug={handleSelectBug}
      />

      <main style={{ flex: 1 }}>
        {route === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onDemoLogin={handleDemoLogin}
          />
        )}

        {route === 'login' && (
          <LoginPage
            onNavigate={handleNavigate}
            initialEmail={registeredEmail}
            onLoginSuccess={() => setRoute('dashboard')}
          />
        )}

        {route === 'register' && (
          <RegisterPage
            onNavigate={handleNavigate}
            onRegisterSuccess={(email) => {
              setRegisteredEmail(email);
              setRoute('login');
            }}
          />
        )}

        {route === 'dashboard' && (
          <DashboardPage
            onNavigate={handleNavigate}
            onSelectBug={handleSelectBug}
          />
        )}

        {route === 'bugs' && (
          <BugListPage
            onNavigate={handleNavigate}
            onSelectBug={handleSelectBug}
          />
        )}

        {route === 'report' && (
          <BugReportPage
            onNavigate={handleNavigate}
            onSelectBug={handleSelectBug}
          />
        )}

        {route === 'detail' && selectedBugId && (
          <BugDetailPage
            bugId={selectedBugId}
            onNavigate={handleNavigate}
          />
        )}

        {route === 'audit-logs' && (
          user?.role === 'ADMIN' ? (
            <AuditLogsPage />
          ) : (
            <div className="app-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
              <h2>Access Denied</h2>
              <p>Only administrators may view audit logs.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleNavigate('dashboard')}
                style={{ marginTop: '1rem' }}
              >
                Go to Dashboard
              </button>
            </div>
          )
        )}
      </main>

      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
        color: 'var(--text-dim)',
        fontSize: '0.8125rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span>🛡️ BugHunt Pro</span>
          <span>•</span>
          <span>Enterprise Vulnerability Management System</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
          <span>Crafted & Developed with Precision by</span>
          <strong style={{
            background: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700',
            fontSize: '0.9rem'
          }}>
            Stella
          </strong>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
