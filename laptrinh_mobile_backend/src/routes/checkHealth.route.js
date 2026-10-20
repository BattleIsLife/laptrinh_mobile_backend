import { Router } from 'express'
import pool from '../config/database.js';

const router = Router();

// Endpoint kiểm tra kết nối DB
router.get('/api/health', async (req, res) => {

    try {
        const [results] = await pool.query('SELECT NOW() AS currentTime');
        res.json({
            status: 'Success',
            message: 'Kết nối MySQL thành công qua Docker/Podman network!',
            currentTime: results[0].currentTime
        });
    } catch (error) {
        return res.status(500).json({ status: 'Error', message: err.message });
    }
});

export default router;