import React from 'react';

const statusConfig = {
  'OPEN': { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
  'ASSIGNED': { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' },
  'IN PROGRESS': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
  'FIXED': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
  'UNDER VERIFICATION': { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' },
  'VERIFIED': { bg: 'rgba(5, 150, 105, 0.15)', text: '#10b981', border: 'rgba(5, 150, 105, 0.3)' },
  'CLOSED': { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' },
  'REOPENED': { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig['OPEN'];

  return (
    <span
      className="badge"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: config.text }} />
      {status}
    </span>
  );
}
