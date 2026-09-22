import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import {
  Bug,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  ShieldAlert,
  ArrowUpRight,
  PlusCircle,
  FileText
} from 'lucide-react';

export default function DashboardPage({ onNavigate, onSelectBug }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBugs, setRecentBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsRes, bugsRes] = await Promise.all([
          api.getDashboardStats(),
          api.getBugs({ limit: 5 })
        ]);
        if (statsRes?.data) setStats(statsRes.data);
        if (bugsRes?.data) setRecentBugs(bugsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading && !stats) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p>Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ fontSize: '0.9375rem' }}>
            {user?.role} Portal • Real-time database metrics
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(user?.role === 'REPORTER' || user?.role === 'SECURITY_RESEARCHER' || user?.role === 'ADMIN') && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('report')}
            >
              <PlusCircle size={16} /> Report Bug
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('bugs')}
          >
            <Bug size={16} /> View All Bugs
          </button>
        </div>
      </div>

      {/* KPI Stats Cards depending on role */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}
      >
        {user?.role === 'ADMIN' && (
          <>
            <StatCard title="Total Platform Users" value={stats?.totalUsers} icon={<Users size={20} color="#6366f1" />} />
            <StatCard title="Total Bug Reports" value={stats?.totalBugs} icon={<Bug size={20} color="#3b82f6" />} />
            <StatCard title="Open / Assigned" value={stats?.openBugs} icon={<Clock size={20} color="#8b5cf6" />} />
            <StatCard title="In Progress" value={stats?.inProgressBugs} icon={<Clock size={20} color="#f59e0b" />} />
            <StatCard title="Fixed & Verified" value={stats?.fixedBugs} icon={<CheckCircle2 size={20} color="#10b981" />} />
            <StatCard title="Closed Reports" value={stats?.closedBugs} icon={<CheckCircle2 size={20} color="#64748b" />} />
            <StatCard title="Critical Severity" value={stats?.criticalBugs} icon={<AlertTriangle size={20} color="#ef4444" />} highlight="#ef4444" />
          </>
        )}

        {user?.role === 'DEVELOPER' && (
          <>
            <StatCard title="Bugs Assigned to Me" value={stats?.assignedBugs} icon={<Bug size={20} color="#8b5cf6" />} />
            <StatCard title="Currently In Progress" value={stats?.inProgressBugs} icon={<Clock size={20} color="#f59e0b" />} />
            <StatCard title="Fixed / Resolved" value={stats?.fixedBugs} icon={<CheckCircle2 size={20} color="#10b981" />} />
            <StatCard title="Critical Priority" value={stats?.criticalBugs} icon={<AlertTriangle size={20} color="#ef4444" />} highlight="#ef4444" />
          </>
        )}

        {(user?.role === 'REPORTER' || user?.role === 'SECURITY_RESEARCHER') && (
          <>
            <StatCard title="My Total Reports" value={stats?.totalBugs} icon={<Bug size={20} color="#3b82f6" />} />
            <StatCard title="Open / Triage" value={stats?.openBugs} icon={<Clock size={20} color="#8b5cf6" />} />
            <StatCard title="In Progress" value={stats?.inProgressBugs} icon={<Clock size={20} color="#f59e0b" />} />
            <StatCard title="Fixed (Need Verification)" value={stats?.fixedBugs} icon={<CheckCircle2 size={20} color="#10b981" />} highlight="#10b981" />
            <StatCard title="Closed / Verified" value={stats?.closedBugs} icon={<CheckCircle2 size={20} color="#64748b" />} />
          </>
        )}
      </div>

      {/* Recent Activity / Bugs List */}
      <div className="glass-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.125rem' }}>Recent Bug Reports</h3>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('bugs')}
          >
            View All <ArrowUpRight size={14} />
          </button>
        </div>

        {recentBugs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            No bug reports available.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentBugs.map((bug) => (
              <div
                key={bug.id}
                onClick={() => onSelectBug(bug.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    color: 'var(--primary)',
                    background: 'var(--primary-light)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    {bug.bug_code}
                  </span>
                  <div>
                    <strong style={{ fontSize: '0.9375rem', color: '#fff', display: 'block' }}>
                      {bug.title}
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                      Category: {bug.category} • Reported by: {bug.reporter_name || 'Anonymous'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <SeverityBadge severity={bug.severity} />
                  <StatusBadge status={bug.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, highlight }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderLeft: highlight ? `4px solid ${highlight}` : '1px solid var(--border-subtle)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '500' }}>
          {title}
        </span>
        {icon}
      </div>
      <div style={{ fontSize: '1.875rem', fontWeight: '800', color: highlight || '#ffffff' }}>
        {value ?? 0}
      </div>
    </div>
  );
}
