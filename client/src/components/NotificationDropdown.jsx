import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Bell, Check, CheckCheck } from 'lucide-react';

export default function NotificationDropdown({ onSelectBug }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res?.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = (notif) => {
    if (!notif.is_read) {
      api.markNotificationRead(notif.id).catch(() => {});
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (notif.bug_id && onSelectBug) {
      onSelectBug(notif.bug_id);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="btn btn-secondary btn-sm"
        style={{ position: 'relative', padding: '0.45rem 0.65rem' }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '9999px',
              fontSize: '0.65rem',
              fontWeight: '700',
              padding: '1px 5px',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '340px',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0.75rem',
            zIndex: 1000,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '0.5rem'
            }}
          >
            <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
              Notifications ({unreadCount} unread)
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {loading && notifications.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
              No notifications yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  style={{
                    padding: '0.625rem',
                    borderRadius: '6px',
                    background: notif.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.1)',
                    borderLeft: notif.is_read ? '2px solid transparent' : '2px solid var(--primary)',
                    cursor: notif.bug_id ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.1)';
                  }}
                >
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: notif.is_read ? 'var(--text-muted)' : '#fff' }}>
                      {notif.message}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!notif.is_read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkRead(e, notif.id)}
                      title="Mark as read"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex'
                      }}
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
