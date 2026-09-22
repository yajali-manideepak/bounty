const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../services/audit.service');
const { createNotification } = require('../services/notification.service');

const router = express.Router();

// Helper to check if a user is authorized to access a given bug
function canAccessBug(user, bug) {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'DEVELOPER') return bug.assigned_to === user.id;
  if (user.role === 'REPORTER' || user.role === 'SECURITY_RESEARCHER') {
    return bug.reporter_id === user.id;
  }
  return false;
}

// GET /api/bugs — Filtered and search-enabled bug list with RBAC scoping
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      search,
      status,
      severity,
      priority,
      category,
      page = 1,
      limit = 50
    } = req.query;

    const conditions = [];
    const params = [];

    // RBAC scoping
    if (req.user.role === 'REPORTER' || req.user.role === 'SECURITY_RESEARCHER') {
      conditions.push('b.reporter_id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'DEVELOPER') {
      conditions.push('b.assigned_to = ?');
      params.push(req.user.id);
    }
    // Admin has no restrictions

    // Filters
    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }
    if (severity) {
      conditions.push('b.severity = ?');
      params.push(severity);
    }
    if (priority) {
      conditions.push('b.priority = ?');
      params.push(priority);
    }
    if (category) {
      conditions.push('b.category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(b.title LIKE ? OR b.bug_code LIKE ? OR b.description LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const countSql = `SELECT COUNT(*) as total FROM bugs b ${whereClause}`;
    const totalRow = await db.get(countSql, params);
    const total = totalRow ? totalRow.total : 0;

    const listSql = `
      SELECT 
        b.id, b.bug_code, b.title, b.category, b.severity, b.priority, b.status,
        b.reporter_id, b.assigned_to, b.created_at, b.updated_at,
        r.name as reporter_name, r.email as reporter_email,
        d.name as developer_name, d.email as developer_email,
        (SELECT COUNT(*) FROM comments c WHERE c.bug_id = b.id) as comment_count
      FROM bugs b
      LEFT JOIN users r ON b.reporter_id = r.id
      LEFT JOIN users d ON b.assigned_to = d.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, parseInt(limit, 10), offset];
    const bugs = await db.all(listSql, queryParams);

    res.status(200).json({
      success: true,
      data: bugs,
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

// POST /api/bugs — Create a new bug report
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      priority,
      reproduction_steps,
      expected_result,
      actual_result
    } = req.body;

    if (!title || !description || !category || !severity || !priority) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title, description, category, severity, and priority are required fields.' }
      });
    }

    const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];

    if (!validSeverities.includes(severity.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: { message: `Severity must be one of: ${validSeverities.join(', ')}` }
      });
    }

    if (!validPriorities.includes(priority.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: { message: `Priority must be one of: ${validPriorities.join(', ')}` }
      });
    }

    // Atomic bug code generator
    const lastRow = await db.get('SELECT id FROM bugs ORDER BY id DESC LIMIT 1');
    const nextSeq = (lastRow ? lastRow.id : 0) + 1;
    const bugCode = `BUG-${String(nextSeq).padStart(4, '0')}`;

    const insertResult = await db.run(
      `INSERT INTO bugs (
        bug_code, title, description, category, severity, priority, status,
        reporter_id, reproduction_steps, expected_result, actual_result
      ) VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?)`,
      [
        bugCode,
        title.trim(),
        description.trim(),
        category.trim(),
        severity.toUpperCase(),
        priority.toUpperCase(),
        req.user.id,
        reproduction_steps ? reproduction_steps.trim() : null,
        expected_result ? expected_result.trim() : null,
        actual_result ? actual_result.trim() : null
      ]
    );

    const bugId = insertResult.lastID;

    // Create Audit Log
    await createAuditLog(
      req.user.id,
      'BUG_CREATED',
      'BUG',
      bugId,
      `Bug report created ${bugCode}: ${title.trim().substring(0, 50)}`
    );

    // Fetch the newly created bug with reporter details
    const newBug = await db.get(
      `SELECT 
        b.*, 
        r.name as reporter_name, r.email as reporter_email
      FROM bugs b
      LEFT JOIN users r ON b.reporter_id = r.id
      WHERE b.id = ?`,
      [bugId]
    );

    res.status(201).json({
      success: true,
      message: 'Bug reported successfully.',
      data: newBug
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/bugs/:id — View single bug details with strict IDOR access control
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const bugId = req.params.id;
    const bug = await db.get(
      `SELECT 
        b.*,
        r.name as reporter_name, r.email as reporter_email,
        d.name as developer_name, d.email as developer_email
      FROM bugs b
      LEFT JOIN users r ON b.reporter_id = r.id
      LEFT JOIN users d ON b.assigned_to = d.id
      WHERE b.id = ?`,
      [bugId]
    );

    if (!bug) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bug report not found.' }
      });
    }

    if (!canAccessBug(req.user, bug)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access forbidden. You do not have permission to view this bug report.' }
      });
    }

    res.status(200).json({
      success: true,
      data: bug
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bugs/:id/assign — Admin assigns bug to developer
router.patch('/:id/assign', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const bugId = req.params.id;
    const { developer_id } = req.body;

    if (!developer_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'developer_id is required.' }
      });
    }

    const bug = await db.get('SELECT * FROM bugs WHERE id = ?', [bugId]);
    if (!bug) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bug report not found.' }
      });
    }

    // Verify developer exists and is active developer
    const dev = await db.get(
      "SELECT id, name, email FROM users WHERE id = ? AND role = 'DEVELOPER' AND is_active = 1",
      [developer_id]
    );

    if (!dev) {
      return res.status(400).json({
        success: false,
        error: { message: 'Target user is not an active developer.' }
      });
    }

    await db.run(
      "UPDATE bugs SET assigned_to = ?, status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [developer_id, bugId]
    );

    // Create Notification for assigned developer
    await createNotification(
      developer_id,
      bugId,
      `You have been assigned to bug ${bug.bug_code}: ${bug.title}`
    );

    // Create Audit Log
    await createAuditLog(
      req.user.id,
      'BUG_ASSIGNED',
      'BUG',
      bugId,
      `Admin assigned ${bug.bug_code} to developer ${dev.name} (${dev.email})`
    );

    const updatedBug = await db.get(
      `SELECT 
        b.*,
        r.name as reporter_name, r.email as reporter_email,
        d.name as developer_name, d.email as developer_email
      FROM bugs b
      LEFT JOIN users r ON b.reporter_id = r.id
      LEFT JOIN users d ON b.assigned_to = d.id
      WHERE b.id = ?`,
      [bugId]
    );

    res.status(200).json({
      success: true,
      message: `Bug assigned to ${dev.name} successfully.`,
      data: updatedBug
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bugs/:id/status — Status transition workflow state machine
router.patch('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const bugId = req.params.id;
    const { status: targetStatus } = req.body;

    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        error: { message: 'Target status is required.' }
      });
    }

    const bug = await db.get('SELECT * FROM bugs WHERE id = ?', [bugId]);
    if (!bug) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bug report not found.' }
      });
    }

    if (!canAccessBug(req.user, bug)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access forbidden. You do not have permission to modify this bug.' }
      });
    }

    const current = bug.status;
    const target = targetStatus.toUpperCase();
    const userRole = req.user.role;
    const isAssignedDev = bug.assigned_to === req.user.id;
    const isReporter = bug.reporter_id === req.user.id;
    const isAdmin = userRole === 'ADMIN';

    // State machine transition validator:
    // Defined transitions and their allowed actor roles:
    const transitions = {
      'OPEN': {
        'ASSIGNED': (r) => r.isAdmin,
        'CLOSED': (r) => r.isAdmin
      },
      'ASSIGNED': {
        'IN PROGRESS': (r) => r.isAssignedDev || r.isAdmin,
        'CLOSED': (r) => r.isAdmin
      },
      'IN PROGRESS': {
        'FIXED': (r) => r.isAssignedDev || r.isAdmin,
        'CLOSED': (r) => r.isAdmin
      },
      'FIXED': {
        'UNDER VERIFICATION': (r) => r.isReporter || r.isAdmin,
        'CLOSED': (r) => r.isAdmin
      },
      'UNDER VERIFICATION': {
        'VERIFIED': (r) => r.isReporter || r.isAdmin,
        'REOPENED': (r) => r.isReporter || r.isAdmin,
        'CLOSED': (r) => r.isAdmin
      },
      'REOPENED': {
        'IN PROGRESS': (r) => r.isAssignedDev || r.isAdmin,
        'CLOSED': (r) => r.isAdmin
      },
      'VERIFIED': {
        'CLOSED': (r) => r.isReporter || r.isAdmin
      },
      'CLOSED': {
        'REOPENED': (r) => r.isAdmin
      }
    };

    const allowedNext = transitions[current];
    if (!allowedNext || !allowedNext[target]) {
      const validTargets = allowedNext ? Object.keys(allowedNext).join(', ') : 'none';
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid status transition from '${current}' to '${target}'. Allowed transitions: [${validTargets}]`
        }
      });
    }

    const rolePermitted = allowedNext[target]({
      isAssignedDev,
      isReporter,
      isAdmin
    });

    if (!rolePermitted) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Your role (${userRole}) is not authorized to transition this bug from '${current}' to '${target}'.`
        }
      });
    }

    // Execute status update
    await db.run(
      'UPDATE bugs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [target, bugId]
    );

    // Audit log
    await createAuditLog(
      req.user.id,
      'STATUS_CHANGED',
      'BUG',
      bugId,
      `Status changed from ${current} to ${target} by ${req.user.name} (${req.user.role})`
    );

    // Trigger context notifications
    if (target === 'FIXED') {
      await createNotification(
        bug.reporter_id,
        bugId,
        `Bug ${bug.bug_code} has been marked as FIXED by developer.`
      );
    } else if (target === 'REOPENED') {
      if (bug.assigned_to) {
        await createNotification(
          bug.assigned_to,
          bugId,
          `Bug ${bug.bug_code} was REOPENED for further work.`
        );
      }
    } else if (target === 'VERIFIED') {
      if (bug.assigned_to) {
        await createNotification(
          bug.assigned_to,
          bugId,
          `Fix for bug ${bug.bug_code} was VERIFIED by reporter.`
        );
      }
    } else if (target === 'CLOSED') {
      if (bug.assigned_to && bug.assigned_to !== req.user.id) {
        await createNotification(
          bug.assigned_to,
          bugId,
          `Bug ${bug.bug_code} has been CLOSED.`
        );
      }
    }

    const updatedBug = await db.get(
      `SELECT 
        b.*,
        r.name as reporter_name, r.email as reporter_email,
        d.name as developer_name, d.email as developer_email
      FROM bugs b
      LEFT JOIN users r ON b.reporter_id = r.id
      LEFT JOIN users d ON b.assigned_to = d.id
      WHERE b.id = ?`,
      [bugId]
    );

    res.status(200).json({
      success: true,
      message: `Status updated to ${target}.`,
      data: updatedBug
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
