import { Router } from 'express';
import { verifyToken } from "../middlewares/auth.middleware.js";
import { addNewSaving, deleteSaving, editSaving, getSaving } from "../controllers/saving.controller.js";

const router = Router();

// Lấy danh sách tài sản
// Truyền tham số ?saving_id=<mã tài sản> để lấy một tài sản cụ thể
router.get('/api/savings', verifyToken, getSaving);

// Thêm tài sản
router.post('/api/savings', verifyToken, addNewSaving);

// Sửa tài sản
router.patch('/api/savings', verifyToken, editSaving);

// Xóa tài sản
router.delete('/api/savings', verifyToken, deleteSaving);

export default router;