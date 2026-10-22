import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/config.js';
import { queryGet } from '../database/db.js';
import { logSecurityEvent } from './auditLogger.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Access Denied',
      message: 'No authorization token provided. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const user = await queryGet(
      'SELECT id, username, email, role, full_name, avatar, wallet_balance, mfa_enabled FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      await logSecurityEvent({
        event_type: 'INVALID_TOKEN_USER_NOT_FOUND',
        severity: 'WARN',
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        details: `Decoded user ID ${decoded.id} no longer exists in database.`
      });
      return res.status(401).json({ error: 'Session Invalid', message: 'User does not exist.' });
    }

    req.user = user;
    next();
  } catch (err) {
    await logSecurityEvent({
      event_type: 'AUTH_TOKEN_VERIFY_FAIL',
      severity: 'WARN',
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `JWT Verification Failed: ${err.message}`
    });
    return res.status(403).json({
      error: 'Token Invalid or Expired',
      message: 'Please authenticate again.'
    });
  }
};

/**
 * Optional authentication: populates req.user if token is present, but doesn't block guests
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const user = await queryGet(
      'SELECT id, username, email, role, full_name, avatar, wallet_balance FROM users WHERE id = ?',
      [decoded.id]
    );
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
};

/**
 * Role-Based Access Control (RBAC) middleware
 */
export const requireRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      await logSecurityEvent({
        event_type: 'RBAC_ACCESS_DENIED',
        severity: 'HIGH',
        user_id: req.user.id,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        details: `User '${req.user.username}' with role '${req.user.role}' attempted to access restricted endpoint requiring [${allowedRoles.join(', ')}]. Path: ${req.originalUrl}`
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: `Your role (${req.user.role}) is not authorized for this resource.`
      });
    }

    next();
  };
};
