import crypto from 'crypto';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { logSecurityEvent } from '../middleware/auditLogger.js';

export const createOrder = async (req, res) => {
  try {
    const { gig_id, package_tier, requirements } = req.body;

    if (!gig_id || !package_tier) {
      return res.status(400).json({ error: 'Validation Error', message: 'Gig ID and package tier required.' });
    }

    const gig = await queryGet('SELECT * FROM gigs WHERE id = ?', [gig_id]);
    if (!gig) {
      return res.status(404).json({ error: 'Not Found', message: 'Gig does not exist.' });
    }

    if (gig.freelancer_id === req.user.id) {
      return res.status(400).json({ error: 'Invalid Action', message: 'You cannot purchase your own gig.' });
    }

    let price = 0;
    if (package_tier === 'basic') price = gig.tier_basic_price;
    else if (package_tier === 'standard') price = gig.tier_standard_price;
    else if (package_tier === 'premium') price = gig.tier_premium_price;
    else return res.status(400).json({ error: 'Invalid Tier', message: 'Tier must be basic, standard, or premium.' });

    // Check client balance
    const client = await queryGet('SELECT wallet_balance FROM users WHERE id = ?', [req.user.id]);
    if (client.wallet_balance < price) {
      return res.status(400).json({
        error: 'Insufficient Balance',
        message: `Your balance ($${client.wallet_balance.toFixed(2)}) is insufficient for this order ($${price.toFixed(2)}).`
      });
    }

    // Deduct balance from client
    await queryRun('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?', [price, req.user.id]);

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const escrowTxHash = crypto.createHash('sha256')
      .update(`${orderNumber}|${req.user.id}|${gig.freelancer_id}|${price}|${Date.now()}`)
      .digest('hex');

    const result = await queryRun(`
      INSERT INTO orders (
        order_number, gig_id, client_id, freelancer_id, package_tier, amount, status, escrow_tx_hash, requirements
      ) VALUES (?, ?, ?, ?, ?, ?, 'escrow_locked', ?, ?)
    `, [orderNumber, gig.id, req.user.id, gig.freelancer_id, package_tier, price, escrowTxHash, requirements || '']);

    const newOrderId = result.lastID;

    // Tamper-evident log
    await logSecurityEvent({
      event_type: 'ESCROW_FUNDS_LOCKED',
      severity: 'INFO',
      user_id: req.user.id,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `Escrow hold activated for Order #${orderNumber}. Amount: $${price.toFixed(2)} locked in smart escrow contract. TxHash: ${escrowTxHash}`
    });

    res.status(201).json({
      message: 'Order placed and funds safely deposited into Escrow Vault',
      orderId: newOrderId,
      orderNumber,
      amount: price,
      escrowTxHash,
      status: 'escrow_locked'
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    let sql = `
      SELECT o.*, g.title as gig_title, g.cover_image as gig_cover,
             u_client.username as client_username, u_client.full_name as client_name,
             u_free.username as freelancer_username, u_free.full_name as freelancer_name
      FROM orders o
      JOIN gigs g ON o.gig_id = g.id
      JOIN users u_client ON o.client_id = u_client.id
      JOIN users u_free ON o.freelancer_id = u_free.id
    `;
    const params = [];

    // BOLA/IDOR protection: filter strictly by authenticated user's role and ID
    if (req.user.role === 'admin' || req.user.role === 'auditor') {
      // Admins see all orders for oversight
      sql += ' ORDER BY o.id DESC';
    } else if (req.user.role === 'freelancer') {
      sql += ' WHERE o.freelancer_id = ? ORDER BY o.id DESC';
      params.push(req.user.id);
    } else {
      sql += ' WHERE o.client_id = ? ORDER BY o.id DESC';
      params.push(req.user.id);
    }

    const orders = await queryAll(sql, params);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await queryGet(`
      SELECT o.*, g.title as gig_title, g.description as gig_description, g.cover_image as gig_cover,
             u_client.username as client_username, u_client.full_name as client_name, u_client.avatar as client_avatar,
             u_free.username as freelancer_username, u_free.full_name as freelancer_name, u_free.avatar as freelancer_avatar
      FROM orders o
      JOIN gigs g ON o.gig_id = g.id
      JOIN users u_client ON o.client_id = u_client.id
      JOIN users u_free ON o.freelancer_id = u_free.id
      WHERE o.id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ error: 'Not Found', message: 'Order does not exist.' });
    }

    // BOLA/IDOR Defense: Check ownership
    const isOwner = order.client_id === req.user.id || order.freelancer_id === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'auditor';

    if (!isOwner && !isAdmin) {
      await logSecurityEvent({
        event_type: 'BOLA_IDOR_ATTEMPT_BLOCKED',
        severity: 'HIGH',
        user_id: req.user.id,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        details: `IDOR Alert: User '${req.user.username}' (ID: ${req.user.id}) attempted unauthorized read on Order #${order.order_number} belonging to client #${order.client_id} / freelancer #${order.freelancer_id}`
      });

      return res.status(403).json({
        error: 'Access Forbidden (BOLA/IDOR Defense Triggered)',
        message: 'You do not have authorization to view this order. Incident has been logged in SOC.'
      });
    }

    // Fetch deliverables and messages for this order
    const deliverables = await queryAll('SELECT * FROM deliverables WHERE order_id = ? ORDER BY id DESC', [id]);
    const messages = await queryAll(`
      SELECT m.*, u.username as sender_username, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.order_id = ?
      ORDER BY m.id ASC
    `, [id]);

    res.json({
      order,
      deliverables,
      messages
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const releaseEscrow = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await queryGet('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) {
      return res.status(404).json({ error: 'Not Found', message: 'Order does not exist.' });
    }

    // Only the client who placed the order or an admin can release escrow
    if (order.client_id !== req.user.id && req.user.role !== 'admin') {
      await logSecurityEvent({
        event_type: 'UNAUTHORIZED_ESCROW_RELEASE_ATTEMPT',
        severity: 'HIGH',
        user_id: req.user.id,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        details: `Unauthorized attempt to release escrow for Order #${order.order_number}`
      });
      return res.status(403).json({ error: 'Forbidden', message: 'Only the ordering client or admin can release escrow funds.' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ error: 'Invalid State', message: 'Escrow has already been completed.' });
    }

    // Release payout to freelancer
    await queryRun('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [order.amount, order.freelancer_id]);
    await queryRun("UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

    await logSecurityEvent({
      event_type: 'ESCROW_FUNDS_RELEASED',
      severity: 'INFO',
      user_id: req.user.id,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `Escrow payout released for Order #${order.order_number}. Payout: $${order.amount.toFixed(2)} transferred to Freelancer ID ${order.freelancer_id}`
    });

    res.json({
      message: 'Escrow released successfully. Deliverable accepted and payment transferred.',
      status: 'completed'
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const disputeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await queryGet('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) return res.status(404).json({ error: 'Not Found' });

    if (order.client_id !== req.user.id && order.freelancer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await queryRun("UPDATE orders SET status = 'disputed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

    await logSecurityEvent({
      event_type: 'ORDER_ESCROW_DISPUTED',
      severity: 'WARN',
      user_id: req.user.id,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `Dispute raised on Order #${order.order_number}. Reason: ${reason || 'Deliverable non-compliance'}. Escrow frozen.`
    });

    res.json({
      message: 'Order disputed. Escrow funds locked pending mediation.',
      status: 'disputed'
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};
