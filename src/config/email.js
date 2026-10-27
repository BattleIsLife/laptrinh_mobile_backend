import 'dotenv/config';
import nodemailer from 'nodemailer';

// 1. Cấu hình Transporter kết nối với dịch vụ Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Bổ sung đoạn này để tránh lỗi tường lửa/mạng chặn xác thực từ Docker
    tls: {
        rejectUnauthorized: false
    }
});

export default transporter;