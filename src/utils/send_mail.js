import transporter from "../config/email.js";

export default async function send_mail(to, subject, text, html){
    // Kiểm tra kết nối SMTP khi khởi động server
    transporter.verify((error, success) => {
        if(success)
            console.log(success);
        if (error) {
            console.error('Lỗi kết nối SMTP Gmail:', error);
        } else {
            console.log('Hệ thống SMTP Gmail đã sẵn sàng gửi thư!');
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,        // Hiển thị tên người gửi
        to: to,            // Email người nhận
        subject: subject,  // Tiêu đề email
        text: text || '',  // Nội dung dạng văn bản thuần
        html: html || ''   // Nội dung dạng giao diện HTML (nếu có)
    };

    await transporter.sendMail(mailOptions);
}