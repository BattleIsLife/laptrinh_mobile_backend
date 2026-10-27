import { Router } from 'express'
import {verifyToken} from '../middlewares/auth.middleware.js'
const router = Router();

// Test thử Auth Middleware
router.get('/api/testAuth', verifyToken, async (req, res) => {
    try {
        res.status(200).json({
            status: 'success',
            message: 'Xác thực token thành công'
        });
    } catch (error) {
        return res.status(500).json({ status: 'Error', message: error.message });
    }
});

export default router;