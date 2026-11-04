import { Router } from "express";
import { openCreditAccount, getCreditAccount, updateCreditAccount, closeCreditAccount } from "../controllers/credit_account.controller.js";
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();


// Lấy thông tin thẻ tín dụng của 1 user
// Thêm ?account_id = ... để lấy cụ thể 1 id
router.get('/api/credit_account', verifyToken, getCreditAccount);

// Mở thẻ tín dụng
router.post('/api/credit_account', verifyToken, openCreditAccount);

// Cập nhật thông tin thẻ tín dụng
router.patch('/api/credit_account', verifyToken, updateCreditAccount);

// Đóng thẻ tín dụng
router.delete('/api/credit_account', verifyToken, closeCreditAccount);

export default router; 