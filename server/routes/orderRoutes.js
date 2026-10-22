import express from 'express';
import { createOrder, getOrders, getOrderById, releaseEscrow, disputeOrder } from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/:id/release', releaseEscrow);
router.post('/:id/dispute', disputeOrder);

export default router;
