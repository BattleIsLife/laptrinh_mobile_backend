import pool from "../config/database.js";

export default class HealhScoreModel {
    // Viết tạm hàm tính toán ở đây, không rõ có nên chuyển sang hàm khác không

    // Cho DTI
    static async getSumMonthlyPayment(user_id){
        const sql = `SELECT SUM(monthly_payment) AS monthly_payment FROM debts 
                     WHERE user_id = ? AND 
                     STATUS = 'ACTIVE'`;
        const [rows] = await pool.execute(sql, [user_id])
        return rows[0].monthly_payment ?? 0;
    }


    // Cho Saving Rate và Cashflow
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

    // Dành cho tính số tháng quỹ khẩn cấp
    static async getSumEssentialExpense(user_id, month, year){
        const sql = `SELECT SUM(amount) AS sum_expense FROM expense_transactions et JOIN categories c
                     ON et.category_id = c.id 
                     WHERE user_id = ? AND 
                     MONTH(transaction_date) = ? AND 
                     YEAR(transaction_date) = ?
                     AND is_essential = TRUE`;
        const [rows] = await pool.execute(sql, [user_id, month, year])
        return rows[0].sum_expense ?? 0;
    }

    static async getSumSaving(user_id){
        const sql = `SELECT SUM(current_amount) AS sum_saving FROM savings 
                     WHERE user_id = ? AND 
                     status = 'ACTIVE'`;
        const [rows] = await pool.execute(sql, [user_id])
        return rows[0].sum_saving ?? 0;
    }

    // Cho CUR (Maybe)

}