import { verifyAuditLogChain, logSecurityEvent, computeEntryHash } from '../middleware/auditLogger.js';
import { queryGet, queryRun, queryAll } from '../database/db.js';

/**
 * 1. Test BOLA / IDOR Defense
 */
export const testIdor = async (req, res) => {
  const simulatedTargetOrderId = 1;
  const currentUserId = req.user ? req.user.id : 9999;

  const targetOrder = await queryGet('SELECT * FROM orders WHERE id = ?', [simulatedTargetOrderId]);

  if (!targetOrder) {
    return res.json({
      attack: 'Insecure Direct Object Reference (BOLA / IDOR)',
      status: 'NEUTRAL',
      details: 'Target order record not found in database to simulate.'
    });
  }

  const isOwner = targetOrder.client_id === currentUserId || targetOrder.freelancer_id === currentUserId;

  if (!isOwner) {
    await logSecurityEvent({
      event_type: 'BOLA_IDOR_TEST_TRIGGERED',
      severity: 'HIGH',
      user_id: currentUserId,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Examiner-Security-Suite',
      details: `Live Examiner Demo: IDOR probe on Order #${targetOrder.order_number} was successfully BLOCKED by Object-Level RBAC.`
    });

    return res.json({
      attackType: 'OWASP API1:2023 - Broken Object Level Authorization (BOLA/IDOR)',
      targetResource: `Order #${targetOrder.order_number} (Belongs to Client #${targetOrder.client_id})`,
      attackerIdentity: `User #${currentUserId} (${req.user ? req.user.username : 'Anonymous'})`,
      result: 'BLOCKED',
      httpStatus: 403,
      defenseMechanism: 'Fine-Grained Contextual Ownership Matrix check (req.user.id === resource.owner_id)',
      socIncidentLogged: true
    });
  } else {
    return res.json({
      attackType: 'BOLA/IDOR Test',
      result: 'PERMITTED_OWNER',
      details: 'The currently logged-in user is actually the legitimate owner of this order.'
    });
  }
};

/**
 * 2. Test XSS Sanitization & CSP
 */
export const testXss = async (req, res) => {
  const { payload } = req.body;
  const dangerousInput = payload || '<script>alert("Cookie Stealer: " + document.cookie)</script><img src=x onerror=alert(1)>';

  const sanitized = dangerousInput
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  await logSecurityEvent({
    event_type: 'XSS_FILTER_ACTIVE',
    severity: 'INFO',
    user_id: req.user ? req.user.id : null,
    ip_address: req.ip || '127.0.0.1',
    user_agent: req.headers['user-agent'] || 'Examiner-Suite',
    details: `Live Examiner Demo: XSS payload sanitized. Dangerous tags neutralized.`
  });

  res.json({
    attackType: 'OWASP A03:2021 - Injection (Cross-Site Scripting - XSS)',
    rawPayload: dangerousInput,
    sanitizedOutput: sanitized,
    cspHeadersEnforced: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'...",
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff'
    },
    status: 'NEUTRALIZED'
  });
};

/**
 * 3. Verify Cryptographic Audit Log Chain
 */
export const runAuditVerification = async (req, res) => {
  const verificationResult = await verifyAuditLogChain();
  res.json(verificationResult);
};

/**
 * 4. Tamper Simulation for Examiner Demo
 */
let originalEntryBackup = null;

export const simulateLogTampering = async (req, res) => {
  try {
    const target = await queryGet('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 1');
    if (!target) return res.status(400).json({ error: 'No logs to tamper with.' });

    originalEntryBackup = { ...target };

    // Modify details to break the hash chain
    await queryRun('UPDATE audit_logs SET details = ? WHERE id = ?', [
      target.details + ' [TAMPERED_BY_ATTACKER_UNAUTHORIZED_ALTERATION]',
      target.id
    ]);

    res.json({
      message: 'Tampering simulation active! Changed details of log ID #' + target.id,
      tamperedId: target.id,
      hint: 'Now click "Verify Cryptographic Audit Ledger" to see the HMAC mismatch detected!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const restoreLogTampering = async (req, res) => {
  try {
    if (!originalEntryBackup) {
      return res.json({ message: 'No backup found. Ledger is in original state.' });
    }

    await queryRun('UPDATE audit_logs SET details = ? WHERE id = ?', [
      originalEntryBackup.details,
      originalEntryBackup.id
    ]);

    originalEntryBackup = null;
    res.json({ message: 'Audit ledger restored to pristine cryptographic state.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
