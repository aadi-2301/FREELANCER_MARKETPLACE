import { queryAll, queryGet, queryRun } from '../database/db.js';
import { logSecurityEvent } from '../middleware/auditLogger.js';

// Sensitive patterns for Data Loss Prevention (DLP)
const DLP_PATTERNS = [
  { name: 'Credit Card Number', regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g },
  { name: 'Direct Email Contact (Anti-Circumvention)', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g },
  { name: 'Phone Number / WhatsApp', regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { name: 'Cryptocurrency Wallet', regex: /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g },
  { name: 'API Key / Secret Token', regex: /(?:api[_-]?key|secret|token|password)[\s:=]+['"]?[A-Za-z0-9_\-]{16,}['"]?/i }
];

export const sendMessage = async (req, res) => {
  try {
    const { order_id, message } = req.body;

    if (!order_id || !message || message.trim() === '') {
      return res.status(400).json({ error: 'Validation Error', message: 'Order ID and non-empty message are required.' });
    }

    const order = await queryGet('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (!order) {
      return res.status(404).json({ error: 'Not Found', message: 'Order does not exist.' });
    }

    // Authorization: User must be either the client or freelancer on this order
    const isClient = order.client_id === req.user.id;
    const isFreelancer = order.freelancer_id === req.user.id;

    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'You cannot participate in this conversation.' });
    }

    const receiverId = isClient ? order.freelancer_id : order.client_id;

    // Run DLP (Data Loss Prevention) Analysis
    let dlpFlagged = 0;
    const warnings = [];
    let sanitizedMessage = message;

    for (const pattern of DLP_PATTERNS) {
      if (pattern.regex.test(message)) {
        dlpFlagged = 1;
        warnings.push(pattern.name);
        // Redact pattern
        sanitizedMessage = sanitizedMessage.replace(pattern.regex, '[REDACTED BY DLP POLICY]');
      }
    }

    const dlpWarningText = warnings.length > 0
      ? `Security Alert: Potential sensitive data policy violation detected (${warnings.join(', ')}). Off-platform exchange is restricted to prevent escrow fraud.`
      : null;

    if (dlpFlagged) {
      await logSecurityEvent({
        event_type: 'DLP_POLICY_VIOLATION',
        severity: 'WARN',
        user_id: req.user.id,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        details: `DLP Filter triggered in Order #${order.order_number}: ${warnings.join(', ')}`
      });
    }

    const result = await queryRun(`
      INSERT INTO messages (order_id, sender_id, receiver_id, message, dlp_flagged, dlp_warning)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [order_id, req.user.id, receiverId, sanitizedMessage, dlpFlagged, dlpWarningText]);

    const createdMsg = await queryGet(`
      SELECT m.*, u.username as sender_username, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [result.lastID]);

    res.status(201).json({
      message: 'Message sent successfully',
      data: createdMsg
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const getOrderMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await queryGet('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.client_id !== req.user.id && order.freelancer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const messages = await queryAll(`
      SELECT m.*, u.username as sender_username, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.order_id = ?
      ORDER BY m.id ASC
    `, [orderId]);

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};
