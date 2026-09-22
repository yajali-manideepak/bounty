const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — Get user notifications and unread count
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const notifications = await db.all(
      `SELECT n.id, n.bug_id, n.message, n.is_read, n.created_at, b.bug_code
       FROM notifications n
       LEFT JOIN bugs b ON n.bug_id = b.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const unreadCountRow = await db.get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount: unreadCountRow ? unreadCountRow.count : 0
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read — Mark single notification as read
router.patch('/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const notifId = req.params.id;
    await db.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notifId, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all — Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res, next) => {
  try {
    await db.run(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
