import crypto from 'crypto'

export default function generateOTP() {
    // Sinh số ngẫu nhiên từ 100000 đến 999999
    const otp = crypto.randomInt(100000, 1000000); 
    return otp.toString();
}
