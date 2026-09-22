const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/audit-logs — Admin-only audit trail
router.get('/audit-logs', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { action, limit = 100, page = 1 } = req.query;

    const conditions = [];
    const params = [];

    if (action) {
      conditions.push('a.action = ?');
      params.push(action);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const countRow = await db.get(
      `SELECT COUNT(*) as total FROM audit_logs a ${whereClause}`,
      params
    );
    const total = countRow ? countRow.total : 0;

    const logs = await db.all(
      `SELECT 
        a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
        u.name as actor_name, u.email as actor_email, u.role as actor_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
