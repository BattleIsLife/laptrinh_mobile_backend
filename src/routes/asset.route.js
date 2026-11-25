import { Router } from 'express';
import { verifyToken } from "../middlewares/auth.middleware.js";
import { addNewAsset, deleteAsset, editAsset, getAssets } from "../controllers/asset.controller.js";

const router = Router();

// Lấy danh sách tài sản
// Truyền tham số ?asset_id=<mã tài sản> để lấy một tài sản cụ thể
router.get('/api/assets', verifyToken, getAssets);

// Thêm tài sản
router.post('/api/assets', verifyToken, addNewAsset);

// Sửa tài sản
router.patch('/api/assets', verifyToken, editAsset);

// Xóa tài sản
router.delete('/api/assets', verifyToken, deleteAsset);

export default router;