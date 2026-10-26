import mysql from 'mysql2/promise';
import 'dotenv/config';

// Cấu hình Connection Pool để tối ưu kết nối
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // BẮT BUỘC: Cấu hình SSL cho Aiven
  ssl: {
    rejectUnauthorized: true, 
    ca: process.env.DB_CA_CERT // Chúng ta sẽ truyền chuỗi Certificate vào đây
  }
});

export default pool;