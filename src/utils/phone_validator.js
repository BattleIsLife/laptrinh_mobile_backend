export default function phoneValidator(phone) {
    if (!phone) {
        return { is_valid: false, message: "Số điện thoại không được để trống" }
    }
    const clean_phone = phone.trim(); // xóa khoảng trắng
    const phone_regex = /^0[0-9]{9}$/; // chuỗi regex 
    /* Giải thích regex:
        /^, $/: ký hiệu bắt đầu, kết thúc chuỗi regex
        0: bắt buộc có số 0 ở đầu
        [0-9]{9}: 9 số còn lại ngẫu nhiên từ 0 đến 9
    */
    if (!phone_regex.test(clean_phone)) {
        return { is_valid: false, message: "Số điện thoại không đúng định dạng (gồm 10 chữ số)" }
    } else {
        return { is_valid: true, valid_phone: clean_phone }
    }
}