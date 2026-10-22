import crypto from 'crypto';
import { CONFIG } from '../config/config.js';
import { queryGet, queryRun, queryAll } from '../database/db.js';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes an HMAC-SHA256 hash for a log entry payload
 */
export const computeEntryHash = (prevHash, timestamp, eventType, severity, userId, ip, details) => {
  const payload = `${prevHash}|${timestamp}|${eventType}|${severity}|${userId || 'anon'}|${ip}|${details}`;
  return crypto.createHmac('sha256', CONFIG.HMAC_AUDIT_SECRET).update(payload).digest('hex');
};

/**
 * Logs a security or operational event to the tamper-evident audit ledger
 */
export const logSecurityEvent = async ({
  event_type,
  severity = 'INFO',
  user_id = null,
  ip_address = '127.0.0.1',
  user_agent = 'Unknown',
  details = ''
}) => {
  try {
    const lastEntry = await queryGet('SELECT id, current_hash FROM audit_logs ORDER BY id DESC LIMIT 1');
    const previous_hash = lastEntry ? lastEntry.current_hash : GENESIS_HASH;
    const timestamp = new Date().toISOString();

    const current_hash = computeEntryHash(
      previous_hash,
      timestamp,
      event_type,
      severity,
      user_id,
      ip_address,
      details
    );

    const result = await queryRun(
      `INSERT INTO audit_logs (timestamp, event_type, severity, user_id, ip_address, user_agent, details, previous_hash, current_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [timestamp, event_type, severity, user_id, ip_address, user_agent, details, previous_hash, current_hash]
    );

    return {
      id: result.lastID,
      timestamp,
      previous_hash,
      current_hash,
      event_type,
      severity
    };
  } catch (err) {
    console.error('[-] Audit log insertion failed:', err.message);
    return null;
  }
};

/**
 * Express middleware helper to extract client IP and user agent
 */
export const auditMiddleware = (eventType, severity = 'INFO', detailExtractor = null) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode < 400 && severity !== 'INFO') return;
      const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const user_agent = req.headers['user-agent'] || 'Unknown';
      const user_id = req.user ? req.user.id : null;
      const details = detailExtractor ? detailExtractor(req, res) : `${req.method} ${req.originalUrl} - Status: ${res.statusCode}`;

      await logSecurityEvent({
        event_type: eventType,
        severity,
        user_id,
        ip_address,
        user_agent,
        details
      });
    });
    next();
  };
};

/**
 * Cryptographic chain verification: recalculates hashes row-by-row
 */
export const verifyAuditLogChain = async () => {
  const logs = await queryAll('SELECT * FROM audit_logs ORDER BY id ASC');
  if (!logs || logs.length === 0) {
    return { valid: true, totalEntries: 0, message: 'Ledger is empty. No tampering possible.' };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];

    // Check link to previous record
    if (entry.previous_hash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAtId: entry.id,
        brokenIndex: i,
        reason: 'Previous hash mismatch (Broken chain pointer)',
        expectedPrevHash,
        actualPrevHash: entry.previous_hash,
        tamperedEntry: entry
      };
    }

    // Recompute current hash
    const recomputedHash = computeEntryHash(
      entry.previous_hash,
      entry.timestamp,
      entry.event_type,
      entry.severity,
      entry.user_id,
      entry.ip_address,
      entry.details
    );

    if (recomputedHash !== entry.current_hash) {
      return {
        valid: false,
        brokenAtId: entry.id,
        brokenIndex: i,
        reason: 'HMAC signature mismatch (Entry data tampered)',
        expectedHash: recomputedHash,
        actualHash: entry.current_hash,
        tamperedEntry: entry
      };
    }

    expectedPrevHash = entry.current_hash;
  }

  return {
    valid: true,
    totalEntries: logs.length,
    latestHash: expectedPrevHash,
    message: 'Cryptographic chain intact. 100% Tamper-Evident verified.'
  };
};
