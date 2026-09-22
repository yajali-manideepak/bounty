const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { createAuditLog } = require('../services/audit.service');
const { createNotification } = require('../services/notification.service');

const router = express.Router({ mergeParams: true });

// Check access permission helper
function canAccessBug(user, bug) {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'DEVELOPER') return bug.assigned_to === user.id;
  if (user.role === 'REPORTER' || user.role === 'SECURITY_RESEARCHER') {
    return bug.reporter_id === user.id;
  }
  return false;
}

// GET /api/bugs/:bugId/comments
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const bugId = req.params.bugId;
    const bug = await db.get('SELECT * FROM bugs WHERE id = ?', [bugId]);

    if (!bug) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bug not found.' }
      });
    }

    if (!canAccessBug(req.user, bug)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access forbidden. You do not have permission to view comments for this bug.' }
      });
    }

    const comments = await db.all(
      `SELECT 
        c.id, c.bug_id, c.user_id, c.content, c.created_at,
        u.name as author_name, u.email as author_email, u.role as author_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.bug_id = ?
      ORDER BY c.created_at ASC`,
      [bugId]
    );

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/bugs/:bugId/comments
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const bugId = req.params.bugId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Comment content cannot be empty.' }
      });
    }

    const bug = await db.get('SELECT * FROM bugs WHERE id = ?', [bugId]);

    if (!bug) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bug not found.' }
      });
    }

    if (!canAccessBug(req.user, bug)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access forbidden. You do not have permission to comment on this bug.' }
      });
    }

    const insertResult = await db.run(
      'INSERT INTO comments (bug_id, user_id, content) VALUES (?, ?, ?)',
      [bugId, req.user.id, content.trim()]
    );

    const commentId = insertResult.lastID;

    // Audit log
    await createAuditLog(
      req.user.id,
      'COMMENT_ADDED',
      'BUG',
      bugId,
      `User ${req.user.name} commented on ${bug.bug_code}`
    );

    // Notify counterpart
    if (req.user.role === 'DEVELOPER' && bug.reporter_id) {
      await createNotification(
        bug.reporter_id,
        bugId,
        `Developer ${req.user.name} commented on bug ${bug.bug_code}`
      );
    } else if ((req.user.role === 'REPORTER' || req.user.role === 'SECURITY_RESEARCHER') && bug.assigned_to) {
      await createNotification(
        bug.assigned_to,
        bugId,
        `Reporter ${req.user.name} commented on bug ${bug.bug_code}`
      );
    }

    const newComment = await db.get(
      `SELECT 
        c.id, c.bug_id, c.user_id, c.content, c.created_at,
        u.name as author_name, u.email as author_email, u.role as author_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`,
      [commentId]
    );

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully.',
      data: newComment
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
