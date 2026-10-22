import express from 'express';
import { getAllGigs, getGigById, createGig } from '../controllers/gigController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllGigs);
router.get('/:id', getGigById);
router.post('/', authenticateToken, requireRole(['freelancer', 'admin']), createGig);

export default router;
