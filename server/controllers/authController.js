import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/config.js';
import { queryGet, queryRun } from '../database/db.js';
import { logSecurityEvent } from '../middleware/auditLogger.js';

export const register = async (req, res) => {
  try {
    const { username, email, password, role, full_name, bio, skills } = req.body;

    if (!username || !email || !password || !role || !full_name) {
      return res.status(400).json({ error: 'Validation Error', message: 'All required fields must be provided.' });
    }

    if (!['client', 'freelancer', 'admin', 'auditor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid Role', message: 'Role must be client, freelancer, admin, or auditor.' });
    }

    // Check existing
    const existing = await queryGet('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'Username or email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const initialBalance = role === 'client' ? 2500.00 : 250.00;
    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify([skills || 'General']);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

    const result = await queryRun(
      `INSERT INTO users (username, email, password_hash, role, full_name, avatar, bio, skills, wallet_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, password_hash, role, full_name, avatar, bio || '', skillsJson, initialBalance]
    );

    const newUserId = result.lastID;

    await logSecurityEvent({
      event_type: 'USER_REGISTERED',
      severity: 'INFO',
      user_id: newUserId,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `New user created: ${username} with role ${role}`
    });

    const token = jwt.sign(
      { id: newUserId, username, role },
      CONFIG.JWT_SECRET,
      { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUserId,
        username,
        email,
        role,
        full_name,
        avatar,
        wallet_balance: initialBalance
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password, mfaCode } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Validation Error', message: 'Username and password required.' });
    }

    const user = await queryGet('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);

    if (!user) {
      await logSecurityEvent({
        event_type: 'AUTH_FAILED_USER_UNKNOWN',
        severity: 'WARN',
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        details: `Login failure: unknown identifier '${username}'`
      });
      return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logSecurityEvent({
        event_type: 'AUTH_FAILED_BAD_PASSWORD',
        severity: 'WARN',
        user_id: user.id,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        details: `Failed password attempt for user '${user.username}'`
      });
      return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid credentials.' });
    }

    // Check MFA if enabled
    if (user.mfa_enabled) {
      if (!mfaCode) {
        return res.status(206).json({
          mfaRequired: true,
          userId: user.id,
          message: 'MFA 6-digit verification code required.'
        });
      }
      // Demo MFA code verification (fixed secret or demo 6-digit check)
      if (mfaCode !== '123456' && mfaCode !== user.mfa_secret) {
        await logSecurityEvent({
          event_type: 'MFA_VERIFY_FAILURE',
          severity: 'HIGH',
          user_id: user.id,
          ip_address: req.ip || '127.0.0.1',
          user_agent: req.headers['user-agent'] || 'Unknown',
          details: `Invalid MFA token submitted for user '${user.username}'`
        });
        return res.status(401).json({ error: 'MFA Failed', message: 'Invalid 6-digit MFA verification code.' });
      }
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      CONFIG.JWT_SECRET,
      { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );

    await logSecurityEvent({
      event_type: 'AUTH_SUCCESS',
      severity: 'INFO',
      user_id: user.id,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `Successful login for user '${user.username}' [Role: ${user.role}]`
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar: user.avatar,
        bio: user.bio,
        skills: JSON.parse(user.skills || '[]'),
        wallet_balance: user.wallet_balance,
        mfa_enabled: !!user.mfa_enabled
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await queryGet(
      'SELECT id, username, email, role, full_name, avatar, bio, skills, rating, reviews_count, wallet_balance, mfa_enabled, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'Not found' });

    user.skills = JSON.parse(user.skills || '[]');
    user.mfa_enabled = !!user.mfa_enabled;
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const toggleMFA = async (req, res) => {
  try {
    const user = await queryGet('SELECT mfa_enabled, mfa_secret FROM users WHERE id = ?', [req.user.id]);
    const newState = user.mfa_enabled ? 0 : 1;
    const secret = newState ? '123456' : null;

    await queryRun('UPDATE users SET mfa_enabled = ?, mfa_secret = ? WHERE id = ?', [newState, secret, req.user.id]);

    await logSecurityEvent({
      event_type: newState ? 'MFA_ACTIVATED' : 'MFA_DEACTIVATED',
      severity: 'INFO',
      user_id: req.user.id,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `User toggled MFA: ${newState ? 'ENABLED' : 'DISABLED'}`
    });

    res.json({
      mfa_enabled: !!newState,
      demoCode: newState ? '123456' : null,
      message: `Multi-Factor Authentication has been ${newState ? 'enabled' : 'disabled'}.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

/**
 * Quick Switcher for Live Examiner Demo
 */
export const quickLogin = async (req, res) => {
  try {
    const { role } = req.body;
    let targetUser;

    if (role === 'admin') {
      targetUser = await queryGet("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    } else if (role === 'freelancer') {
      targetUser = await queryGet("SELECT * FROM users WHERE role = 'freelancer' LIMIT 1");
    } else {
      targetUser = await queryGet("SELECT * FROM users WHERE role = 'client' LIMIT 1");
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Demo user not found. Please run seed script.' });
    }

    const token = jwt.sign(
      { id: targetUser.id, username: targetUser.username, role: targetUser.role },
      CONFIG.JWT_SECRET,
      { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );

    await logSecurityEvent({
      event_type: 'EXAMINER_DEMO_SWITCH',
      severity: 'INFO',
      user_id: targetUser.id,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `Demo session switched to role: ${targetUser.role} (${targetUser.username})`
    });

    res.json({
      message: `Switched session to ${targetUser.role}`,
      token,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role,
        full_name: targetUser.full_name,
        avatar: targetUser.avatar,
        bio: targetUser.bio,
        skills: JSON.parse(targetUser.skills || '[]'),
        wallet_balance: targetUser.wallet_balance,
        mfa_enabled: !!targetUser.mfa_enabled
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};
