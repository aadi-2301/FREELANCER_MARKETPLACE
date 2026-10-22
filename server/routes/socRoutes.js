import express from 'express';
import { getSocMetrics, getSocLogs } from '../controllers/socController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// SOC dashboard metrics and audit logs require admin or auditor role
router.get('/metrics', authenticateToken, requireRole(['admin', 'auditor']), getSocMetrics);
router.get('/logs', authenticateToken, requireRole(['admin', 'auditor']), getSocLogs);

export default router;
