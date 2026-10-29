export default function emailValidator(email) {
    if (!email) {
        return { is_valid: false, message: "Email không được để trống" }
    }
    const clean_email = email.trim(); // xóa khoảng trắng
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // chuỗi regex 
    /* Giải thích regex:
        /^, $/: ký hiệu bắt đầu, kết thúc chuỗi regex
        [^\s@]: cho phép bất kỳ ký tự nào ko phải khoảng trắng và dấu @
        +@: bắt buộc có dấu @
        +\.: bắt buộc có dấu chấm (.) 
    */
    if (!email_regex.test(clean_email)) {
        return { is_valid: false, message: "Định dạng Email không hợp lệ (ví dụ: name@example.com)" }
    } else {
        return { is_valid: true, valid_email: clean_email }
    }
}