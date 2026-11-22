import pool from "../config/database.js";

export default class HealhScoreModel {
    // Viết tạm hàm tính toán ở đây

    // Cho DTI
    static async getSumMonthlyPayment(user_id, month, year){
        const sql = `SELECT SUM(dp.amount_due) AS monthly_payment FROM debt_payments dp JOIN debts d 
                     ON dp.debt_id = d.id 
                     WHERE user_id = ? AND 
                     MONTH(due_date) = ? AND 
                     YEAR(due_date) = ?`;
        const [rows] = await pool.execute(sql, [user_id, month, year])
        return rows[0].monthly_payment ?? 0;
    }


    // Cho Saving Rate
    static async getSumIncome(user_id, month, year){
        const sql = `SELECT SUM(amount) AS sum_income FROM income_transactions 
                     WHERE user_id = ? AND 
                     MONTH(transaction_date) = ? AND 
                     YEAR(transaction_date) = ?`;
        const [rows] = await pool.execute(sql, [user_id, month, year])
        return rows[0].sum_income ?? 0;
    }

    static async getSumExpense(user_id, month, year){
        const sql = `SELECT SUM(amount) AS sum_expense FROM expense_transactions 
                     WHERE user_id = ? AND 
                     MONTH(transaction_date) = ? AND 
                     YEAR(transaction_date) = ?`;
        const [rows] = await pool.execute(sql, [user_id, month, year])
        return rows[0].sum_expense ?? 0;
    }
}