import AuthModel from "../models/auth.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

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