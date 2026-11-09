import pool from '../config/database.js';

const dbPool = pool;
const now = new Date();
export default class IncomeModel {
    static async getAllIncomeTransactions(user_id, page = 0, month = now.getMonth() + 1, year = now.getFullYear()) {
        const offset = page * 10;
        const sql = "SELECT id, amount, source, income_type, DATE_FORMAT(transaction_date, '%Y-%m-%d') as transaction_date, description" +
            " FROM income_transactions WHERE user_id = ? AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? LIMIT 10 OFFSET ?";
        const [rows] = await dbPool.execute(sql, [user_id, month, year, offset]);
        return rows;
    }
    static async getIncomeTransaction(id, user_id) {
        const sql = "SELECT id, amount, source, income_type, DATE_FORMAT(transaction_date, '%Y-%m-%d') as transaction_date, description"
            + " FROM income_transactions WHERE id = ? AND user_id = ?";
        const [rows] = await dbPool.execute(sql, [id, user_id]);
        return rows[0];
    }
    static async getStatistic(user_id, month = now.getMonth() + 1, year = now.getFullYear()) {
        const sql = "SELECT SUM(amount) as amount, DATE_FORMAT(transaction_date, '%Y-%m-%d') as date" +  
        " FROM income_transactions WHERE user_id = ? AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? GROUP BY transaction_date"
        // console.log(sql);
        const [rows] = await dbPool.execute(sql, [user_id, month, year]);
        return rows;
    }
    static async getTotalIncome(user_id, month = now.getMonth() + 1, year = now.getFullYear()) {
        const sql = "SELECT SUM(amount) as amount FROM " + 
        " income_transactions WHERE user_id = ? AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?"
        const [rows] = await dbPool.execute(sql, [user_id, month, year]);
        return rows[0].amount ?? 0; // nếu có giá trị thì trả về, ngược lại trả về 0
    }
    static async getIncomeStructure(user_id, month = now.getMonth() + 1, year = now.getFullYear()) {
        const sql = "SELECT income_type, SUM(amount) as amount" + 
        " FROM income_transactions WHERE user_id = ? AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? GROUP BY income_type ORDER BY SUM(amount) DESC"
        const [rows] = await dbPool.execute(sql, [user_id, month, year]);
        return rows;
    }
    static async addIncomeTransaction(data) {

    }
    static async updateIncomeTransaction(id, data) {

    }
    static async deleteIncomeTransaction(id) {

    }
}