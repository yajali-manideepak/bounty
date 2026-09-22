import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { Search, Filter, PlusCircle, MessageSquare, User, Calendar, RefreshCw } from 'lucide-react';

export default function BugListPage({ onNavigate, onSelectBug }) {
  const { user } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const loadBugs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getBugs({
        search,
        status: statusFilter,
        severity: severityFilter,
        page: pagination.page,
        limit: 25
      });
      if (res?.data) {
        setBugs(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load bugs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, severityFilter, pagination.page]);

  useEffect(() => {
    loadBugs();
  }, [loadBugs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadBugs();
  };

  return (
    <div className="app-container">
      {/* Header */}
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
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Bug Reports</h1>
          <p style={{ fontSize: '0.875rem' }}>
            {user?.role === 'ADMIN' && 'Displaying all system bug reports (Admin Overview)'}
            {user?.role === 'DEVELOPER' && 'Displaying bug reports assigned to you'}
            {(user?.role === 'REPORTER' || user?.role === 'SECURITY_RESEARCHER') && 'Displaying your submitted bug reports'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadBugs}
            title="Refresh List"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          {(user?.role === 'REPORTER' || user?.role === 'SECURITY_RESEARCHER' || user?.role === 'ADMIN') && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('report')}
            >
              <PlusCircle size={16} /> Report Bug
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, code, or description..."
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search
            size={16}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} color="var(--text-dim)" />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
              <option value="FIXED">FIXED</option>
              <option value="UNDER VERIFICATION">UNDER VERIFICATION</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REOPENED">REOPENED</option>
            </select>
          </div>

          <select
            className="form-select"
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Bug Table / Cards */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            Loading bug reports...
          </div>
        ) : bugs.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              No bug reports matching your criteria.
            </p>
            {(user?.role === 'REPORTER' || user?.role === 'SECURITY_RESEARCHER' || user?.role === 'ADMIN') && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate('report')}
              >
                <PlusCircle size={14} /> Submit the first report
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Bug Code</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Title & Category</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Severity</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Assigned To</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Reported By</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Activity</th>
                </tr>
              </thead>
              <tbody>
                {bugs.map((bug) => (
                  <tr
                    key={bug.id}
                    onClick={() => onSelectBug(bug.id)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        color: 'var(--primary)',
                        background: 'var(--primary-light)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8125rem'
                      }}>
                        {bug.bug_code}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>
                        {bug.title}
                      </strong>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        {bug.category}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <SeverityBadge severity={bug.severity} />
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <StatusBadge status={bug.status} />
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {bug.developer_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fff' }}>
                          <User size={13} color="var(--primary)" />
                          <span>{bug.developer_name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                      {bug.reporter_name || 'Reporter'}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dim)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                          <MessageSquare size={13} /> {bug.comment_count || 0}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                          <Calendar size={13} /> {new Date(bug.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
