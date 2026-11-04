import pool from "../config/database.js";

export default class CreditAccountModel {

    // Lấy tài khoản của người dùng
    static async getAccountByIdAndUser(id, user_id) {
        const sql = `SELECT * FROM credit_accounts WHERE id = ? AND user_id = ?`;
        const [rows] = await pool.execute(sql, [id, user_id]);
        return rows[0] ?? null;
    }

    // Thêm tài khoản tín dụng
    static async create(user_id, account_type, bank_name, credit_limit, current_balance, opened_date)
    {
        const sql = `INSERT INTO credit_accounts(user_id, account_type, bank_name, credit_limit, current_balance, opened_date) 
                                 VALUES(?, ?, ?, ?, ?, ?)`;
        const [rows] = await pool.execute(sql, [user_id, account_type, bank_name, credit_limit, current_balance, opened_date])
        return rows.insertedId ?? null;
    }

    // Sửa tài khoản tín dụng
    static async update(id, user_id, account_type, bank_name, credit_limit, current_balance)
    {
        const sql = `UPDATE credit_accounts SET account_type = ?,
                                               bank_name = ?,
                                               credit_limit = ?,
                                               current_balance = ?,
                                         WHERE id = ? AND user_id = ?`;
        const [rows] = await pool.execute(sql, [account_type, bank_name, credit_limit, current_balance, id, user_id])
        return rows.affectedRows ?? null;
    }

    // Xóa tài khoản tín dụng (hoặc là đóng tài khoản)
    static async close(id, user_id, closed_date)
    {
        const sql = `UPDATE credit_accounts SET closed_date = ?,
                                               status = 'CLOSED'
                                         WHERE id = ? AND user_id = ?`;
        const [rows] = await pool.execute(sql, [closed_date, id, user_id])
        return rows.affectedRows ?? null;
    }
}