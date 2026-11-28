import { Router } from 'express';
import { calculateCreditScore, getCreditScore, getCreditScoreHistory, getCreditScoreRecommendation } from '../controllers/credit_score.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/api/credit_score/calculate', verifyToken, calculateCreditScore)
router.get('/api/credit_score/', verifyToken, getCreditScore)
router.get('/api/credit_score/history', verifyToken, getCreditScoreHistory)
router.get('/api/credit_score/recommendation/:id', verifyToken, getCreditScoreRecommendation)


export default router;