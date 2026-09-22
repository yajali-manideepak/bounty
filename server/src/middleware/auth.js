const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, env.authSecret);
    const user = await db.get(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User account no longer exists.' }
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: { message: 'User account is deactivated.' }
      });
    }

    // Attach verified user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication token has expired. Please log in again.' }
      });
    }
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid authentication token.' }
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required.' }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
        }
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
