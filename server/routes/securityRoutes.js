import express from 'express';
import {
  testIdor,
  testXss,
  runAuditVerification,
  simulateLogTampering,
  restoreLogTampering
} from '../controllers/securityController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/test-idor', optionalAuth, testIdor);
router.post('/test-xss', testXss);
router.get('/verify-audit-chain', runAuditVerification);
router.post('/simulate-tamper', simulateLogTampering);
router.post('/restore-tamper', restoreLogTampering);

export default router;
