import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { History, Shield, Filter, RefreshCw } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        action: actionFilter,
        page: pagination.page,
        limit: 50
      });
      if (res?.data) {
        setLogs(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, pagination.page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionBadgeColor = (action) => {
    if (action.includes('LOGIN')) return '#10b981';
    if (action.includes('LOGOUT')) return '#64748b';
    if (action.includes('CREATED')) return '#3b82f6';
    if (action.includes('ASSIGNED')) return '#8b5cf6';
    if (action.includes('STATUS')) return '#f59e0b';
    if (action.includes('COMMENT')) return '#06b6d4';
    return '#94a3b8';
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <History size={24} color="var(--primary)" />
            <h1 style={{ fontSize: '2rem', margin: 0 }}>System Audit Logs</h1>
          </div>
          <p style={{ fontSize: '0.875rem' }}>
            Immutable administrative record of all critical platform activities
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadLogs}
        >
          <RefreshCw size={16} /> Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-dim)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Filter by Action:</span>
          <select
            className="form-select"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="">All Actions</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="USER_LOGOUT">USER_LOGOUT</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
            <option value="BUG_CREATED">BUG_CREATED</option>
            <option value="BUG_ASSIGNED">BUG_ASSIGNED</option>
            <option value="STATUS_CHANGED">STATUS_CHANGED</option>
            <option value="COMMENT_ADDED">COMMENT_ADDED</option>
          </select>
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
          Total logged events: <strong>{pagination.total}</strong>
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            No audit records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Actor</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Action</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Target Entity</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const color = getActionBadgeColor(log.action);
                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        {log.actor_name ? (
                          <div>
                            <strong style={{ color: '#fff', display: 'block' }}>{log.actor_name}</strong>
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{log.actor_role}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>System</span>
                        )}
                      </td>

                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            fontFamily: 'var(--font-mono)',
                            background: `${color}1a`,
                            color: color,
                            border: `1px solid ${color}40`
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                          {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                        </span>
                      </td>

                      <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-main)', maxWidth: '400px' }}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
