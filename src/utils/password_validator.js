export default function passwordValidator(password) {
    if (!password) {
        return { is_valid: false, message: "Mật khẩu không được để trống" }
    }

    const clean_password = password.trim(); // xóa khoảng trắng
    if (clean_password.length < 8) {
        return { is_valid: false, message: "Mật khẩu phải có tổi thiểu 8 ký tự" }
    }
    const password_regex = /^(?=.*[a-z])(?=.*\d)(?=.*[A-Z]).+$/; // chuỗi regex 
    /* Giải thích regex:
        ?=.*: nhìn về phía trước xem có ký tự chỉ định ko
    */
    if (!password_regex.test(clean_password)) {
        return { is_valid: false, message: "Mật khẩu phải chứa cả chữ hoa, chữ thường và số (ví dụ: Abc123456)" }
    } else {
        return { is_valid: true, valid_password: clean_password }
    }
}