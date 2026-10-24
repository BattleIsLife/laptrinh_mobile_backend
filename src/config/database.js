import mysql from 'mysql2/promise';
import 'dotenv/config';

// Thay chuỗi Service URI lấy từ Aiven vào đây
const connectionUri = process.env.AIVEN_URI; 

const pool = mysql.createPool({
  uri: connectionUri,
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 20000 // Tăng timeout lên 20s
});

export default pool;