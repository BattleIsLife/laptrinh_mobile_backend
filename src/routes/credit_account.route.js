import { Router } from "express";
import { openCreditAccount } from "../controllers/credit_account.controller.js";
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Mở thẻ tín dụng
router.post('/api/credit_account', verifyToken, openCreditAccount);

export default router; 