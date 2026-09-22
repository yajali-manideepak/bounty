const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const env = require('../config/env');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../services/audit.service');

const router = express.Router();
const saltRounds = 10;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.authSecret,
    { expiresIn: '24h' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: { message: 'All fields (name, email, password, role) are required.' }
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide a valid email address.' }
      });
    }

    if (password.length < 8 || password.length > 16) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be between 8 and 16 characters in length.' }
      });
    }

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    if (!hasLetters || !hasNumbers) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be a combination of both letters and numbers.' }
      });
    }

    const allowedRegistrationRoles = ['REPORTER', 'DEVELOPER', 'SECURITY_RESEARCHER'];
    if (role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Public registration for ADMIN role is strictly forbidden.' }
      });
    }

    if (!allowedRegistrationRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: { message: `Role must be one of: ${allowedRegistrationRoles.join(', ')}` }
      });
    }

    // Check if user already exists
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this email address already exists.' }
      });
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), cleanEmail, passwordHash, role]
    );

    const newUser = {
      id: result.lastID,
      name: name.trim(),
      email: cleanEmail,
      role: role
    };

    await createAuditLog(newUser.id, 'USER_REGISTERED', 'USER', newUser.id, `User registered with role ${role}`);

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: newUser
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required.' }
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'No account registered with this email address. Please check your email or register.' }
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: { message: 'Your account has been deactivated. Please contact an administrator.' }
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Incorrect password. Login failed. Please enter the password you registered with.' }
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    await createAuditLog(safeUser.id, 'USER_LOGIN', 'USER', safeUser.id, 'User logged in successfully');

    const token = generateToken(safeUser);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password — Reset forgotten password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and new password are required.' }
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'No registered account found with this email address.' }
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: { message: 'Your account has been deactivated. Please contact an administrator.' }
      });
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      return res.status(400).json({
        success: false,
        error: { message: 'New password must be between 8 and 16 characters in length.' }
      });
    }

    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /[0-9]/.test(newPassword);
    if (!hasLetters || !hasNumbers) {
      return res.status(400).json({
        success: false,
        error: { message: 'New password must be a combination of both letters and numbers.' }
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    await db.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, user.id]
    );

    await createAuditLog(user.id, 'PASSWORD_RESET', 'USER', user.id, 'User reset their password via Forgot Password');

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    await createAuditLog(req.user.id, 'USER_LOGOUT', 'USER', req.user.id, 'User logged out');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

// GET /api/auth/developers (Available to authenticated users for assigning bugs)
router.get('/developers', authenticateToken, async (req, res, next) => {
  try {
    const developers = await db.all(
      "SELECT id, name, email FROM users WHERE role = 'DEVELOPER' AND is_active = 1 ORDER BY name ASC"
    );
    res.status(200).json({
      success: true,
      data: developers
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/users (ADMIN only)
router.get('/users', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const users = await db.all(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
