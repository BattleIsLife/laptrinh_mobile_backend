import pool from "../config/database.js";

export default class UserModel {
    static async updateUserOtp(email,
                               reset_otp, 
                               reset_otp_expires) {
        const sql = `UPDATE users SET reset_otp = ?, 
                                        reset_otp_expires = ? 
                       WHERE email = ?`;

        const [rows] = await pool.execute(sql, [reset_otp, reset_otp_expires, email]);
        return rows.affectedRows;
    }

    static async updateUserPassword(email,
                                    password)
    {
        const sql = `UPDATE users SET password_hash = ?
                       WHERE email = ?`;

        const [rows] = await pool.execute(sql, [password, email]);
        return rows.affectedRows;
    }
}