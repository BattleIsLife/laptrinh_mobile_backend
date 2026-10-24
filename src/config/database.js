import mysql from 'mysql2/promise';
import 'dotenv/config';

// Khởi tạo connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT, // Lưu ý check kỹ Port

    // Unnecessary
    // timezone: '+07:00',     // Khai báo pool kết nối theo giờ VN
    // dateStrings: true,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false // Bắt buộc cho Aiven nếu không truyền CA cert
    },
    connectTimeout: 10000 // Tăng thời gian chờ kết nối lên 10s
});

export default pool;