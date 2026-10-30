import AuthModel from "../models/auth.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import emailValidator from '../utils/email_validator.js'
import phoneValidator from '../utils/phone_validator.js'
import passwordValidator from '../utils/password_validator.js'
import generateOTP from "../utils/otp_generate.js";
import send_mail from "../utils/send_mail.js";
import UserModel from "../models/user.model.js";

export const register = async (req, res) => {
    try {
        // console.log(req.body);
        const { full_name, email, phone, password } = req.body;
        const errors = {}
        const valid_data = {}
        // Validate dữ liệu
        if (!full_name) {
            errors.full_name = "Họ và tên không được để trống";
        } else if (full_name.length > 100) {
            errors.full_name = "Họ và tên không được quá 100 ký tự";
        } else {
            valid_data.full_name = full_name;
        }

        const email_valid_result = emailValidator(email);
        if (email_valid_result.is_valid == false) {
            errors.email = email_valid_result.message;
        } else {
            valid_data.email = email_valid_result.valid_email;
        }

        const phone_valid_result = phoneValidator(phone);
        if (phone_valid_result.is_valid == false) {
            errors.phone = phone_valid_result.message;
        } else {
            valid_data.phone = phone_valid_result.valid_phone;
        }

        const password_valid_result = passwordValidator(password);
        if (password_valid_result.is_valid == false) {
            errors.password = password_valid_result.message;
        } else {
            valid_data.password = password_valid_result.valid_password;
        }

        // Nếu errors ko rỗng (chứng tỏ có lỗi)
        if (Object.keys(errors).length !== 0) {
            return res.status(400).send({ status: "false", message: "Dữ liệu đầu vào không hợp lệ", errors: errors })
        }
        // console.log(valid_data);

        // Kiểm tra tài khoản đã tồn tại
        const phoneExisted = await AuthModel.getUserByPhone(valid_data.phone);
        const emailExisted = await AuthModel.getUserByEmail(valid_data.email);
        if (phoneExisted || emailExisted) {
            // code 409: lỗi xung đột với tài nguyên đã có trên máy chủ
            return res.status(409).json({ status: "false", message: "Số điện thoại hoặc Email này đã được sử dụng" });
        }

        // Băm mật khẩu 
        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(valid_data.password, saltRound);
        // console.log(hashedPassword);

        // lưu người dùng 
        const insertedId = await AuthModel.createUser(valid_data.full_name, valid_data.email, valid_data.phone, hashedPassword);
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
        // Validate dữ liệu
        const errors = {}
        if (!username) {
            errors.username = "Tên đăng nhập không được để trống";
        } 
        if(!password){
            errors.password = "Mật khẩu không được để trống";
        }
        if (Object.keys(errors).length !== 0) {
            return res.status(400).send({ status: "false", message: "Dữ liệu đầu vào không hợp lệ", errors: errors })
        }
        // Kiểm tra có tài khoản theo email hoặc số điện thoại chưa
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
        const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });

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

        if (!email)
            return res.status(400).json({
                status: "false",
                message: "Vui lòng nhập email!!"
            });

        // kiểm tra có tài khoản theo email chưa
        const user = await AuthModel.getUserByEmail(email);
        if (!user)
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

        return res.status(200).json({ status: "success", message: "Đã sinh ra mã OTP" });
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
        if (!email)
            return res.status(400).json({
                status: "false",
                message: "Vui lòng nhập email!!"
            });

        // Kiểm tra mật khẩu
        if (!password || password !== confirm_password)
            return res.status(400).json({
                status: "false",
                message: "Mật khẩu không khớp!!"
            });

        // Kiểm tra tài khoản tồn tại
        const user = await AuthModel.getUserByEmail(email);
        if (!user)
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


        if (String(otp).trim() !== String(user.reset_otp).trim() || now.getTime() > expire_date.getTime())
            return res.status(400).json({
                status: "false",
                message: "OTP của bạn đã hết hạn hoặc không hợp lệ"
            });

        // Băm mật khẩu 
        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(password, saltRound);

        await UserModel.updateUserPassword(email, hashedPassword);
        await UserModel.updateUserOtp(email, null, null);

        return res.status(200).json({ status: "success", message: "Đã đổi mật khẩu thành công!!" });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}