import express from 'express';
import { submitDeliverable, downloadDeliverable } from '../controllers/deliverableController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/fileValidator.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/upload', uploadMiddleware.single('file'), submitDeliverable);
router.get('/:id/download', downloadDeliverable);

export default router;
