import { Router } from "express";
import { openCreditAccount, getCreditAccount, updateCreditAccount, closeCreditAccount } from "../controllers/credit_account.controller.js";
import { createApplication, deleteAppication, getApplication } from "../controllers/credit_application.controller.js";
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();


// Tài khoản tín dụng
// Lấy thông tin thẻ tín dụng của 1 user
// Thêm ?account_id = ... để lấy cụ thể 1 id
router.get('/api/credit_accounts', verifyToken, getCreditAccount);

// Mở thẻ tín dụng
router.post('/api/credit_accounts', verifyToken, openCreditAccount);

// Cập nhật thông tin thẻ tín dụng
router.patch('/api/credit_accounts', verifyToken, updateCreditAccount);

// Đóng thẻ tín dụng
router.delete('/api/credit_accounts', verifyToken, closeCreditAccount);


// Yêu cầu tín dụng
// Lấy các yêu cầu tín dụng
// Thêm ?application_id= ... để lấy cụ thể 1 yêu cầu tín dụng của người dùng
router.get('/api/credit_applications', verifyToken, getApplication);

// Mở yêu cầu tín dụng
router.post('/api/credit_appications', verifyToken, createApplication);

// Xóa yêu cầu tín dụng
router.delete('/api/credit_applications', verifyToken, deleteAppication);

export default router; 