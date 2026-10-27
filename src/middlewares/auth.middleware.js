import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const verifyToken = (req, res, next) => {
    // Kiểm tra xem user đã đăng nhập hay chưa
    const headerAuth = req.headers['authorization']; // nếu chứa token thì nó có dạng Bearer [token]
    // console.log(header);
    const token = headerAuth && headerAuth.split(' ')[1]; // bỏ phần Bearer, chỉ lấy mã token
    if (!token) {
        return res.status(401).json(
            {
                status: "false",
                message: "Không tìm thấy token xác thực"
            }
        )
    }
    // console.log(token);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // nhận được user id (tham số payload) ở bên hàm tạo token trong login
        // console.log(decoded);
        req.user = decoded; // gán vào request để các middleware/controller sau xử lý
        next();
    } catch (error) {
        // console.log(error);
        // Token hết hạn
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: "false", code: 'TOKEN_EXPIRED', message: 'Token đã hết hạn' });
        }
        // Token ko hợp lệ
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: "false", code: 'TOKEN_INVALID', message: 'Token không hợp lệ hoặc sai chữ ký' });
        }
        // Lỗi hệ thống khác
        return res.status(500).json({ status: "false", message: 'Có lỗi xác thực ở phía máy chủ' });
    }
}