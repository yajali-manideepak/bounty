// Centralized API client for BugHunt Pro

const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('bughunt_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('bughunt_token', token);
  } else {
    localStorage.removeItem('bughunt_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || response.statusText || 'An error occurred';
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  getDevelopers: () => request('/auth/developers'),

  // Bugs
  getBugs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) query.append(k, v);
    });
    return request(`/bugs?${query.toString()}`);
  },
  getBugById: (id) => request(`/bugs/${id}`),
  createBug: (bugData) => request('/bugs', { method: 'POST', body: JSON.stringify(bugData) }),
  assignBug: (id, developerId) => request(`/bugs/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ developer_id: developerId })
  }),
  updateBugStatus: (id, status) => request(`/bugs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Comments
  getComments: (bugId) => request(`/bugs/${bugId}/comments`),
  addComment: (bugId, content) => request(`/bugs/${bugId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Admin Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    return request(`/admin/audit-logs?${query.toString()}`);
  }
};
