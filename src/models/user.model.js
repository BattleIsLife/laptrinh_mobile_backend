import pool from "../config/database.js";
const PROFILE_FIELDS = new Set([
    'full_name',
    'date_of_birth',
    'occupation',
    'number_of_dependents',
    'monthly_income'
]);

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
     static async getProfile(userId) {
        const [rows] = await pool.execute(
            `SELECT id, full_name, date_of_birth, occupation, number_of_dependents,
                    monthly_income, created_at, updated_at
             FROM users
             WHERE id = ?`,
            [userId]
        );

        return rows[0] ?? null;
    }

    static async updateProfile(userId, changes) {
        const entries = Object.entries(changes).filter(([field]) => PROFILE_FIELDS.has(field));
        if (entries.length === 0) {
            throw new Error('At least one valid profile field is required');
        }

        const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
        const values = entries.map(([, value]) => value);
        const [result] = await pool.execute(
            `UPDATE users SET ${setClause} WHERE id = ?`,
            [...values, userId]
        );

        return result.affectedRows;
    }
    
}

