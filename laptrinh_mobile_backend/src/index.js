import express from 'express';
import mysql from 'mysql2';

import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Khởi tạo connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',

    // Unnecessary
    // timezone: '+07:00',     // Khai báo pool kết nối theo giờ VN
    // dateStrings: true,
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'expressjs',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Endpoint kiểm tra kết nối DB
app.get('/api/health', (req, res) => {
    pool.query('SELECT NOW() AS currentTime', (err, results) => {
        if (err) {
            return res.status(500).json({ status: 'Error', message: err.message });
        }
        res.json({
            status: 'Success',
            message: 'Kết nối MySQL thành công qua Docker/Podman network!',
            currentTime: results[0].currentTime
        });
    });
});

app.listen(PORT, () => {
    console.log(`Backend Express đang chạy trên port ${PORT}`);
});