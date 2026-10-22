import express from 'express';
import { register, login, getMe, toggleMFA, quickLogin } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', authLimiter, login);
router.get('/me', authenticateToken, getMe);
router.post('/mfa/toggle', authenticateToken, toggleMFA);
router.post('/quick-login', quickLogin);

export default router;
