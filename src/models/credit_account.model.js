import pool from "../config/database.js";

const ACCOUNT_FIELDS = new Set([
    'account_type',
    'bank_name',
    'credit_limit',
    'current_balance',
    'opened_date'
]);

export default class CreditAccountModel {

    // Lấy tất cả tài khoản của người dùng
    static async getAccountsByUser(user_id) {
        const sql = `SELECT * FROM credit_accounts WHERE user_id = ?`;
        const [rows] = await pool.execute(sql, [user_id]);
        return rows;
    }

    // Lấy tài khoản cụ thể của người dùng
    static async getAccountByIdAndUser(id, user_id) {
        const sql = `SELECT * FROM credit_accounts WHERE id = ? AND user_id = ?`;
        const [rows] = await pool.execute(sql, [id, user_id]);
        return rows[0];
    }

    // Thêm tài khoản tín dụng
    static async create(user_id, account_type, bank_name, credit_limit, current_balance, opened_date)
    {
        const sql = `INSERT INTO credit_accounts(user_id, account_type, bank_name, credit_limit, current_balance, opened_date) 
                                 VALUES(?, ?, ?, ?, ?, ?)`;
        const [rows] = await pool.execute(sql, [user_id, account_type, bank_name, credit_limit, current_balance, opened_date])
        return rows.insertedId ?? null;
    }

    // Cập nhật tài khoản tín dụng
    static async update(id, user_id, changes)
    {
        const entries = Object.entries(changes).filter(([field]) => ACCOUNT_FIELDS.has(field));
        if (entries.length === 0) {
            throw new Error('Ít nhất một trường là bắt buộc');
        }

        const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
        const values = entries.map(([, value]) => value);
        const [result] = await pool.execute(
            `UPDATE credit_accounts SET ${setClause} WHERE id = ? AND user_id = ?`,
            [...values, id, user_id]
        );

        return result.affectedRows ?? null;
    }

    // Đóng tài khoản tín dụng
    static async close(id, user_id)
    {
        const sql = `UPDATE credit_accounts SET closed_date = NOW(),
                                               status = 'CLOSED'
                                         WHERE id = ? AND user_id = ?`;
        const [rows] = await pool.execute(sql, [id, user_id])
        return rows.affectedRows ?? null;
    }
}