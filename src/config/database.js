import mysql from 'mysql2/promise';
import 'dotenv/config';

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
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false // Bắt buộc cho Aiven nếu không truyền CA cert
    },
    connectTimeout: 10000 // Tăng thời gian chờ kết nối lên 10s
});

export default pool;