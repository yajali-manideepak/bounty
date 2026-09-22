const db = require('../db');

async function createNotification(userId, bugId, message) {
  if (!userId) return;
  try {
    await db.run(
      'INSERT INTO notifications (user_id, bug_id, message, is_read) VALUES (?, ?, ?, 0)',
      [userId, bugId || null, message]
    );
  } catch (err) {
    console.error('[Notification] Error creating notification:', err.message);
  }
}

module.exports = {
  createNotification
};
