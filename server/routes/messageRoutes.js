import express from 'express';
import { sendMessage, getOrderMessages } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', sendMessage);
router.get('/order/:orderId', getOrderMessages);

export default router;
