import pool from "../config/database.js";

export default class CreditScoreModel {
    // Viết tạm hàm tính toán ở đây
    static async getSumMonthlyPayment(user_id, month, year){
        const sql = `SELECT SUM(total_amount) AS monthly_payment FROM debt_payments dp JOIN debts d 
                     ON dp.debt_id = d.id 
                     WHERE user_id = ? AND 
                     MONTH(due_date) = ? AND 
                     YEAR(due_date) = ?`;
        const [rows] = await pool.execute(sql, [user_id, month, year])
        return rows ?? null;
    }
}