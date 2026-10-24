import mysql from 'mysql2/promise';
import 'dotenv/config';

// Khởi tạo connection pool
// Tái sử dụng pool kết nối trong môi trường Serverless của Vercel
if (!global._mysqlPool) {
  global._mysqlPool = mysql.createPool({
    // Sử dụng chuỗi Service URI từ Aiven HOẶC từng biến rời
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306, // Aiven dùng Port ngẫu nhiên (VD: 15432)
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    
    // Cấu hình SSL bắt buộc cho Aiven
    ssl: {
      rejectUnauthorized: false
    },
    
    // Tối ưu kết nối cho Serverless
    waitForConnections: true,
    connectionLimit: 5, // Đặt giới hạn thấp (3-5) để không gây quá tải Aiven
    queueLimit: 0,
    connectTimeout: 10000 // Tăng thời gian chờ lên 10 giây
  });
}

const pool = global._mysqlPool;

export default pool;