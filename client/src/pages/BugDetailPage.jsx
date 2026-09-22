import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import {
  ArrowLeft,
  User,
  Calendar,
  Send,
  UserCheck,
  CheckCircle,
  Play,
  RotateCcw,
  CheckCheck,
  XCircle,
  Shield,
  MessageSquare
} from 'lucide-react';

export default function BugDetailPage({ bugId, onNavigate }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [bug, setBug] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [developers, setDevelopers] = useState([]);
  const [selectedDev, setSelectedDev] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  const loadBugDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [bugRes, commentsRes] = await Promise.all([
        api.getBugById(bugId),
        api.getComments(bugId)
      ]);
      if (bugRes?.data) setBug(bugRes.data);
      if (commentsRes?.data) setComments(commentsRes.data);

      if (user?.role === 'ADMIN') {
        const devsRes = await api.getDevelopers();
        if (devsRes?.data) {
          setDevelopers(devsRes.data);
          if (bugRes.data.assigned_to) {
            setSelectedDev(bugRes.data.assigned_to.toString());
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load bug report.');
    } finally {
      setLoading(false);
    }
  }, [bugId, user?.role]);

  useEffect(() => {
    loadBugDetails();
  }, [loadBugDetails]);

  // Admin Assignment Action
  const handleAssign = async () => {
    if (!selectedDev) {
      showToast('Please select a developer.', 'error');
      return;
    }
    try {
      setAssigning(true);
      const res = await api.assignBug(bugId, parseInt(selectedDev, 10));
      setBug(res.data);
      showToast(res.message || 'Bug assigned successfully.', 'success');
      loadBugDetails();
    } catch (err) {
      showToast(err.message || 'Failed to assign bug.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // Status Lifecycle Action
  const handleStatusChange = async (targetStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await api.updateBugStatus(bugId, targetStatus);
      setBug(res.data);
      showToast(`Status updated to ${targetStatus}!`, 'success');
      loadBugDetails();
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Comment submission
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await api.addComment(bugId, newComment.trim());
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
      showToast('Comment posted.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to post comment.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p>Loading bug details...</p>
      </div>
    );
  }

  if (error || !bug) {
    return (
      <div className="app-container" style={{ maxWidth: '600px', marginTop: '3rem' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Access Denied or Not Found</h2>
          <p style={{ marginBottom: '1.5rem' }}>{error || 'Unable to view this bug report.'}</p>
          <button type="button" className="btn btn-secondary" onClick={() => onNavigate('bugs')}>
            <ArrowLeft size={16} /> Return to Bug List
          </button>
        </div>
      </div>
    );
  }

  const isAssignedDev = bug.assigned_to === user?.id;
  const isReporter = bug.reporter_id === user?.id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="app-container">
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onNavigate('bugs')}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Bug List
      </button>

      {/* Main Grid: Details (Left) + Workflow Sidebar (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Bug Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Card */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                fontSize: '1rem',
                color: 'var(--primary)',
                background: 'var(--primary-light)',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px'
              }}>
                {bug.bug_code}
              </span>
              <SeverityBadge severity={bug.severity} />
              <StatusBadge status={bug.status} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                Priority: <strong>{bug.priority}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: '1.875rem', lineHeight: '1.3', marginBottom: '0.75rem' }}>
              {bug.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-dim)', fontSize: '0.8125rem', flexWrap: 'wrap' }}>
              <span>Category: <strong style={{ color: 'var(--text-muted)' }}>{bug.category}</strong></span>
              <span>Reported: <strong style={{ color: 'var(--text-muted)' }}>{new Date(bug.created_at).toLocaleString()}</strong></span>
              {bug.updated_at && (
                <span>Updated: <strong style={{ color: 'var(--text-muted)' }}>{new Date(bug.updated_at).toLocaleString()}</strong></span>
              )}
            </div>
          </div>

          {/* Description & Technical Sections */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem', color: '#fff' }}>Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
              {bug.description}
            </p>

            {bug.reproduction_steps && (
              <>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#fff' }}>Steps to Reproduce</h3>
                <div style={{
                  background: 'var(--bg-input)',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '1.5rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {bug.reproduction_steps}
                </div>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {bug.expected_result && (
                <div>
                  <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.35rem', color: '#10b981' }}>Expected Result</h4>
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    {bug.expected_result}
                  </div>
                </div>
              )}

              {bug.actual_result && (
                <div>
                  <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.35rem', color: '#f43f5e' }}>Actual Result</h4>
                  <div style={{ background: 'rgba(244, 63, 94, 0.05)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                    {bug.actual_result}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <MessageSquare size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.125rem', margin: 0 }}>
                Discussion & Activity ({comments.length})
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {comments.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                  No comments yet. Start the conversation below.
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.875rem', color: '#fff' }}>{comment.author_name}</strong>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: '700',
                          background: comment.author_role === 'DEVELOPER' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: comment.author_role === 'DEVELOPER' ? '#a78bfa' : '#34d399'
                        }}>
                          {comment.author_role}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Post Form */}
            <form onSubmit={handleAddComment}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a technical comment, reproduction clarification, or fix details..."
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? 'Posting...' : (
                    <>Post Comment <Send size={14} /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Workflow Actions & Metadata Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Workflow & Status Actions */}
          <div className="glass-card" style={{ borderTop: '3px solid var(--primary)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={16} color="var(--primary)" /> Lifecycle Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Developer Actions */}
              {(isAssignedDev || isAdmin) && bug.status === 'ASSIGNED' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleStatusChange('IN PROGRESS')}
                  disabled={updatingStatus}
                  style={{ width: '100%', background: '#f59e0b', borderColor: '#f59e0b' }}
                >
                  <Play size={16} /> Start Working (IN PROGRESS)
                </button>
              )}

              {(isAssignedDev || isAdmin) && (bug.status === 'IN PROGRESS' || bug.status === 'REOPENED') && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleStatusChange('FIXED')}
                  disabled={updatingStatus}
                  style={{ width: '100%', background: '#10b981', borderColor: '#10b981' }}
                >
                  <CheckCircle size={16} /> Mark as Fixed (FIXED)
                </button>
              )}

              {/* Reporter Actions */}
              {(isReporter || isAdmin) && bug.status === 'FIXED' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleStatusChange('UNDER VERIFICATION')}
                  disabled={updatingStatus}
                  style={{ width: '100%', background: '#06b6d4', borderColor: '#06b6d4' }}
                >
                  <CheckCheck size={16} /> Test Fix (UNDER VERIFICATION)
                </button>
              )}

              {(isReporter || isAdmin) && bug.status === 'UNDER VERIFICATION' && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleStatusChange('VERIFIED')}
                    disabled={updatingStatus}
                    style={{ width: '100%', background: '#059669', borderColor: '#059669' }}
                  >
                    <CheckCheck size={16} /> Verify Fix (VERIFIED)
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleStatusChange('REOPENED')}
                    disabled={updatingStatus}
                    style={{ width: '100%' }}
                  >
                    <RotateCcw size={16} /> Reopen Bug (REOPENED)
                  </button>
                </>
              )}

              {(isReporter || isAdmin) && bug.status === 'VERIFIED' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleStatusChange('CLOSED')}
                  disabled={updatingStatus}
                  style={{ width: '100%' }}
                >
                  <XCircle size={16} /> Close Bug (CLOSED)
                </button>
              )}

              {/* Admin Override Close */}
              {isAdmin && bug.status !== 'CLOSED' && bug.status !== 'VERIFIED' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleStatusChange('CLOSED')}
                  disabled={updatingStatus}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  Admin Override: Close
                </button>
              )}

              {isAdmin && bug.status === 'CLOSED' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleStatusChange('REOPENED')}
                  disabled={updatingStatus}
                  style={{ width: '100%' }}
                >
                  Admin: Reopen Bug
                </button>
              )}
            </div>
          </div>

          {/* Admin Assignment Panel */}
          {isAdmin && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={16} color="var(--accent-purple)" /> Admin Assignment
              </h3>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" htmlFor="dev-select">Assign Developer</label>
                <select
                  id="dev-select"
                  className="form-select"
                  value={selectedDev}
                  onChange={(e) => setSelectedDev(e.target.value)}
                >
                  <option value="">-- Choose Developer --</option>
                  {developers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.email})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAssign}
                disabled={assigning || !selectedDev}
                style={{ width: '100%' }}
              >
                {assigning ? 'Assigning...' : 'Assign & Notify Developer'}
              </button>
            </div>
          )}

          {/* Metadata Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>People & Ownership</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Reporter</span>
                <strong style={{ color: '#fff' }}>{bug.reporter_name || 'Anonymous'}</strong>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{bug.reporter_email}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Assigned Developer</span>
                {bug.developer_name ? (
                  <>
                    <strong style={{ color: '#fff' }}>{bug.developer_name}</strong>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{bug.developer_email}</div>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Not assigned yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
