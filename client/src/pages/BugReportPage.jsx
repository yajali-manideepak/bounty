import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Bug, Send, ArrowLeft } from 'lucide-react';

export default function BugReportPage({ onNavigate, onSelectBug }) {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Security Vulnerability',
    severity: 'HIGH',
    priority: 'HIGH',
    reproduction_steps: '',
    expected_result: '',
    actual_result: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError('Please provide a title and detailed description.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.createBug(formData);
      showToast(`Bug ${res.data.bug_code} created successfully!`, 'success');
      if (onSelectBug) {
        onSelectBug(res.data.id);
      } else {
        onNavigate('bugs');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit bug report.');
      showToast(err.message || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '800px' }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onNavigate('bugs')}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Bug List
      </button>

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bug size={22} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Report a New Bug</h1>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Provide structured details for rapid engineering triage</p>
          </div>
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
              marginBottom: '1.5rem'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Bug Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter bug report title"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Security Vulnerability">Security Vulnerability</option>
                <option value="Authentication & Session">Authentication & Session</option>
                <option value="Data Integrity / API">Data Integrity / API</option>
                <option value="Performance / Memory">Performance / Memory</option>
                <option value="UI & Responsive">UI & Responsive</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="severity">Severity *</label>
              <select
                id="severity"
                name="severity"
                className="form-select"
                value={formData.severity}
                onChange={handleChange}
              >
                <option value="CRITICAL">Critical (RCE, Auth Bypass, Leak)</option>
                <option value="HIGH">High (Privilege Escalation, IDOR)</option>
                <option value="MEDIUM">Medium (Input sanitization, CSRF)</option>
                <option value="LOW">Low (Cosmetic, Minor Info Disclosure)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="priority">Priority *</label>
              <select
                id="priority"
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Detailed Description *</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a comprehensive technical description of the defect or vulnerability..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reproduction_steps">Steps to Reproduce</label>
            <textarea
              id="reproduction_steps"
              name="reproduction_steps"
              className="form-textarea"
              rows={3}
              value={formData.reproduction_steps}
              onChange={handleChange}
              placeholder="1. Navigate to /endpoint&#10;2. Submit payload...&#10;3. Inspect response..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="expected_result">Expected Result</label>
              <textarea
                id="expected_result"
                name="expected_result"
                className="form-textarea"
                rows={2}
                value={formData.expected_result}
                onChange={handleChange}
                placeholder="The system should reject unauthorized requests with 403..."
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="actual_result">Actual Result</label>
              <textarea
                id="actual_result"
                name="actual_result"
                className="form-textarea"
                rows={2}
                value={formData.actual_result}
                onChange={handleChange}
                placeholder="The system executes the query and returns sensitive user records..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('bugs')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : (
                <>Submit Bug Report <Send size={16} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
