import AuthModel from "../models/auth.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import generateOTP from "../utils/otp_generate.js";
import send_mail from "../utils/send_mail.js";
import UserModel from "../models/user.model.js";

export const register = async (req, res) => {
    try {
        // console.log(req.body);
        const { full_name, email, phone, password } = req.body;
        // kiểm tra tài khoản đã tồn tại
        const phoneExisted = await AuthModel.getUserByPhone(phone);
        const emailExisted = await AuthModel.getUserByEmail(email);
        if (phoneExisted || emailExisted) {
            return res.status(401).json({ status: "false", message: "Số điện thoại hoặc Email này đã được sử dụng" });
        }
        // validate dữ liệu

        // băm mật khẩu 
        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(password, saltRound);
        // console.log(hashedPassword);

        // lưu người dùng 
        const insertedId = AuthModel.createUser(full_name, email, phone, hashedPassword);
        if (insertedId) {
            return res.status(201).json({ status: "success", message: "Đăng ký tài khoản thành công" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const login = async (req, res) => {
    try {
        // console.log(req.body);
        const { username, password } = req.body;
        // kiểm tra có tài khoản theo email hoặc số điện thoại chưa
        const user = await AuthModel.getUserByPhone(username) || await AuthModel.getUserByEmail(username);
        // console.log(user);
        if (!user) {
            return res.status(400).json({ status: "false", message: "Tên đăng nhập hoặc mật khẩu không chính xác" })
        }
        // Kiểm tra mật khẩu
        const result = await bcrypt.compare(password, user.password_hash);
        if (!result) {
            return res.status(400).json({ status: "false", message: "Tên đăng nhập hoặc mật khẩu không chính xác" })
        }
        // Tạo token 
        const accessToken = jwt.sign( {id: user.id}, process.env.JWT_SECRET, {expiresIn: "30d"});

        return res.status(200).json(
            {
                status: "success",
                message: "Đăng nhập thành công",
                token: accessToken
            }
        )
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const get_otp = async (req, res) => {
    try {
        const { email } = req.body;

        if(!email)
            return res.status(400).json({
                status: "false",
                message: "Vui lòng nhập email!!"
            });

        // kiểm tra có tài khoản theo email chưa
        const user = await AuthModel.getUserByEmail(email);
        if(!user)
            return res.status(400).json({
                        status: "false",
                        message: "Email này chưa được liên kết với tài khoản nào"
                    });
        
        // Sinh OTP có 6 chữ số
        const otp = generateOTP();

        // Tiến hành soạn thư gửi email
        send_mail(
            user.email,
            "Mã OTP quên mật khẩu",
            "",
            `Mã OTP 6 chữ số được gửi cho bạn có hiệu lực 5 phút: ${otp}`
        );

        // Lấy thời gian hiện tại + 5 phút
        const now = new Date();
        const futureDate = new Date(now.getTime() + 5 * 60000);

        // Chuyển đổi sang định dạng YYYY-MM-DD HH:mm:ss của MySQL
        // const mysqlDateTime = futureDate.toISOString().slice(0, 19).replace('T', ' ');

        await UserModel.updateUserOtp(email, otp, futureDate);

        return res.status(200).json({ status: "success", message: "Đã sinh ra mã OTP"});
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const reset_password = async (req, res) => {
    try {
        const { email, password, confirm_password, otp } = req.body;

        // Validate từng cái một

        // Kiểm tra email
        if(!email)
            return res.status(400).json({
                status: "false",
                message: "Vui lòng nhập email!!"
            });
        
        // Kiểm tra mật khẩu
        if(!password || password !== confirm_password)
            return res.status(400).json({
                status: "false",
                message: "Mật khẩu không khớp!!"
            });
        
        // Kiểm tra tài khoản tồn tại
        const user = await AuthModel.getUserByEmail(email);
        if(!user)
            return res.status(400).json({
                        status: "false",
                        message: "Email này chưa được liên kết với tài khoản nào"
                    });
        
        // Kiểm tra OTP
        const expire_date = new Date(user.reset_otp_expires);
        const now = new Date();

        console.log(now.getTime() > expire_date.getTime())
        console.log(now.getTime())
        console.log(expire_date.getTime())
        

        if(String(otp).trim() !== String(user.reset_otp).trim() || now.getTime() > expire_date.getTime())
            return res.status(400).json({
                        status: "false",
                        message: "OTP của bạn đã hết hạn hoặc không hợp lệ"
                    });

        // Băm mật khẩu 
        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(password, saltRound);

        await UserModel.updateUserPassword(email, hashedPassword);
        await UserModel.updateUserOtp(email, null, null);

        return res.status(200).json({ status: "success", message: "Đã đổi mật khẩu thành công!!"});
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });   
    }
}