const db = require('../db');

async function createAuditLog(userId, action, entityType, entityId = null, details = null) {
  try {
    await db.run(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [userId || null, action, entityType, entityId ? entityId.toString() : null, details || null]
    );
  } catch (err) {
    console.error('[AuditLog] Error recording log:', err.message);
  }
}

module.exports = {
  createAuditLog
};
