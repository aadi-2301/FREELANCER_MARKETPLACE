import path from 'path';
import fs from 'fs';
import { queryGet, queryRun } from '../database/db.js';
import { inspectAndSaveFile } from '../middleware/fileValidator.js';
import { logSecurityEvent } from '../middleware/auditLogger.js';

export const submitDeliverable = async (req, res) => {
  try {
    const { order_id, notes } = req.body;
    const file = req.file;

    if (!order_id || !file) {
      return res.status(400).json({ error: 'Validation Error', message: 'Order ID and file deliverable are required.' });
    }

    const order = await queryGet('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (!order) {
      return res.status(404).json({ error: 'Not Found', message: 'Order does not exist.' });
    }

    // Only the assigned freelancer can submit deliverables for this order
    if (order.freelancer_id !== req.user.id && req.user.role !== 'admin') {
      await logSecurityEvent({
        event_type: 'UNAUTHORIZED_DELIVERABLE_SUBMISSION',
        severity: 'HIGH',
        user_id: req.user.id,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        details: `User #${req.user.id} tried to upload deliverable for unassigned Order #${order.order_number}`
      });
      return res.status(403).json({ error: 'Forbidden', message: 'Only the assigned freelancer can submit deliverables.' });
    }

    // Run Zero-Trust Inspection Pipeline
    const inspection = await inspectAndSaveFile(file, req.user.id, req);

    if (inspection.status === 'rejected') {
      return res.status(400).json({
        error: 'Upload Rejected by Security Policy',
        message: inspection.reason
      });
    }

    // Store in deliverables table
    const result = await queryRun(`
      INSERT INTO deliverables (
        order_id, freelancer_id, filename, original_name, mime_type, size_bytes, sha256_hash, scan_status, scan_details, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      order_id,
      req.user.id,
      inspection.filename,
      inspection.originalName,
      inspection.mimeType,
      inspection.sizeBytes,
      inspection.sha256Hash,
      inspection.status,
      inspection.scanDetails,
      notes || 'Deliverable package'
    ]);

    // If clean, mark order as delivered
    if (inspection.status === 'clean') {
      await queryRun("UPDATE orders SET status = 'delivered', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [order_id]);
    }

    res.status(201).json({
      message: inspection.status === 'clean'
        ? 'Deliverable passed security sandbox inspection and was submitted successfully.'
        : 'WARNING: Security scan detected anomalous signatures. File has been placed in quarantine sandbox.',
      deliverableId: result.lastID,
      scanStatus: inspection.status,
      scanDetails: inspection.scanDetails,
      sha256Hash: inspection.sha256Hash,
      originalName: inspection.originalName
    });
  } catch (err) {
    console.error('Deliverable submit error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const downloadDeliverable = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await queryGet(`
      SELECT d.*, o.client_id, o.freelancer_id as order_freelancer_id
      FROM deliverables d
      JOIN orders o ON d.order_id = o.id
      WHERE d.id = ?
    `, [id]);

    if (!item) {
      return res.status(404).json({ error: 'Not Found', message: 'Deliverable record not found.' });
    }

    // Authorization check
    const isParticipant = req.user.id === item.client_id || req.user.id === item.freelancer_id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'auditor';

    if (!isParticipant && !isAdmin) {
      await logSecurityEvent({
        event_type: 'UNAUTHORIZED_FILE_ACCESS_ATTEMPT',
        severity: 'HIGH',
        user_id: req.user.id,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        details: `IDOR File Download blocked for user #${req.user.id} on Deliverable ID ${id}`
      });
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to download this file.' });
    }

    // Quarantine check
    if (item.scan_status === 'quarantined' && !isAdmin) {
      return res.status(403).json({
        error: 'Security Sandbox Block',
        message: 'This file has been quarantined by the automated malware scanner and cannot be downloaded.'
      });
    }

    const baseDir = item.scan_status === 'clean'
      ? path.join(process.cwd(), 'uploads/deliverables')
      : path.join(process.cwd(), 'uploads/quarantine');

    const filePath = path.join(baseDir, item.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File Not Found on Disk' });
    }

    res.download(filePath, item.original_name);
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};
