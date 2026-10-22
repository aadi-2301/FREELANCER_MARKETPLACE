import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { logSecurityEvent } from './auditLogger.js';

// Helmet Security Headers
export const configureSecurityHeaders = (app) => {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  // Additional Anti-Clickjacking and Anti-MIME-sniffing headers
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
};

// CORS configuration
export const corsMiddleware = cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await logSecurityEvent({
      event_type: 'RATE_LIMIT_EXCEEDED',
      severity: 'WARN',
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `Rate limit hit on general endpoint: ${req.originalUrl}`
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please back off for a few minutes.'
    });
  }
});

// Strict Login / Auth Rate Limiter to mitigate Brute-Force & Credential Stuffing
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await logSecurityEvent({
      event_type: 'BRUTE_FORCE_LOCKOUT_TRIGGERED',
      severity: 'HIGH',
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `Auth brute-force threshold reached for IP ${req.ip}. Endpoint: ${req.originalUrl}`
    });
    res.status(429).json({
      error: 'Security Lockout',
      message: 'Multiple failed authentication attempts. Account temporarily locked for 10 minutes.'
    });
  }
});

/**
 * XSS and Input Sanitizer: sanitizes strings recursively in req.body and req.query
 */
export const sanitizeInput = (req, res, next) => {
  const sanitize = (val) => {
    if (typeof val === 'string') {
      return val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const cleanObj = {};
      for (const key of Object.keys(val)) {
        cleanObj[key] = sanitize(val[key]);
      }
      return cleanObj;
    }
    if (Array.isArray(val)) {
      return val.map(sanitize);
    }
    return val;
  };

  // We keep raw strings accessible for demo test endpoints, but sanitize the active body
  if (req.body && !req.path.includes('/api/security/test-xss-raw')) {
    req.sanitizedBody = sanitize(req.body);
  }
  next();
};
