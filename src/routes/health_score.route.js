import { Router } from 'express';
import { calculateHealthScore } from '../controllers/health_score.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/api/users/health_score', verifyToken, calculateHealthScore);

export default router;