const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats — Dynamic role-calculated metrics from real DB data
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const user = req.user;
    let stats = {};

    if (user.role === 'REPORTER' || user.role === 'SECURITY_RESEARCHER') {
      const totalRow = await db.get(
        'SELECT COUNT(*) as count FROM bugs WHERE reporter_id = ?',
        [user.id]
      );
      const openRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE reporter_id = ? AND status IN ('OPEN', 'ASSIGNED')",
        [user.id]
      );
      const inProgressRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE reporter_id = ? AND status = 'IN PROGRESS'",
        [user.id]
      );
      const fixedRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE reporter_id = ? AND status IN ('FIXED', 'UNDER VERIFICATION', 'VERIFIED')",
        [user.id]
      );
      const closedRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE reporter_id = ? AND status = 'CLOSED'",
        [user.id]
      );

      stats = {
        role: user.role,
        totalBugs: totalRow ? totalRow.count : 0,
        openBugs: openRow ? openRow.count : 0,
        inProgressBugs: inProgressRow ? inProgressRow.count : 0,
        fixedBugs: fixedRow ? fixedRow.count : 0,
        closedBugs: closedRow ? closedRow.count : 0
      };
    } else if (user.role === 'DEVELOPER') {
      const assignedRow = await db.get(
        'SELECT COUNT(*) as count FROM bugs WHERE assigned_to = ?',
        [user.id]
      );
      const inProgressRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE assigned_to = ? AND status = 'IN PROGRESS'",
        [user.id]
      );
      const fixedRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE assigned_to = ? AND status IN ('FIXED', 'UNDER VERIFICATION', 'VERIFIED')",
        [user.id]
      );
      const criticalRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE assigned_to = ? AND severity = 'CRITICAL' AND status != 'CLOSED'",
        [user.id]
      );

      stats = {
        role: user.role,
        assignedBugs: assignedRow ? assignedRow.count : 0,
        inProgressBugs: inProgressRow ? inProgressRow.count : 0,
        fixedBugs: fixedRow ? fixedRow.count : 0,
        criticalBugs: criticalRow ? criticalRow.count : 0
      };
    } else if (user.role === 'ADMIN') {
      const userCountRow = await db.get('SELECT COUNT(*) as count FROM users');
      const totalBugsRow = await db.get('SELECT COUNT(*) as count FROM bugs');
      const openBugsRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE status IN ('OPEN', 'ASSIGNED')"
      );
      const inProgressRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE status = 'IN PROGRESS'"
      );
      const fixedRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE status IN ('FIXED', 'UNDER VERIFICATION', 'VERIFIED')"
      );
      const closedRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE status = 'CLOSED'"
      );
      const criticalRow = await db.get(
        "SELECT COUNT(*) as count FROM bugs WHERE severity = 'CRITICAL' AND status != 'CLOSED'"
      );

      stats = {
        role: user.role,
        totalUsers: userCountRow ? userCountRow.count : 0,
        totalBugs: totalBugsRow ? totalBugsRow.count : 0,
        openBugs: openBugsRow ? openBugsRow.count : 0,
        inProgressBugs: inProgressRow ? inProgressRow.count : 0,
        fixedBugs: fixedRow ? fixedRow.count : 0,
        closedBugs: closedRow ? closedRow.count : 0,
        criticalBugs: criticalRow ? criticalRow.count : 0
      };
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
