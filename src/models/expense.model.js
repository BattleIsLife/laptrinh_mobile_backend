import pool from '../config/database.js';

const dbPool = pool;
const now = new Date();
export default class ExpenseModel {
    static async getAllExpenseTransactions(user_id, page = 0, month = now.getMonth() + 1, year = now.getFullYear()) {
        const offset = page * 10;
        const sql = "SELECT et.id, et.amount, c.name as category_name, DATE_FORMAT(et.transaction_date, '%Y-%m-%d') as transaction_date, et.description" +
            " FROM expense_transactions et LEFT JOIN categories c ON et.category_id = c.id" + 
            " WHERE user_id = ? AND MONTH(et.transaction_date) = ? AND YEAR(et.transaction_date) = ? LIMIT 10 OFFSET ?";
        const [rows] = await dbPool.execute(sql, [user_id, month, year, offset]);
        return rows;
    }
    static async getExpenseTransaction(id, user_id) {
        const sql = "SELECT et.id, et.amount, c.id as category_id, c.name as category_name, DATE_FORMAT(et.transaction_date, '%Y-%m-%d') as transaction_date, et.description"+ 
        " FROM expense_transactions et LEFT JOIN categories c ON et.category_id = c.id WHERE et.id = ? AND et.user_id = ?";
        const [rows] = await dbPool.execute(sql, [id, user_id]);
        return rows[0];
    }
    static async getStatistic(user_id, month = now.getMonth() + 1, year = now.getFullYear()) {
        const sql = "SELECT SUM(amount) as amount, DATE_FORMAT(transaction_date, '%Y-%m-%d') as date" +
            " FROM expense_transactions WHERE user_id = ? AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? GROUP BY transaction_date"
        // console.log(sql);
        const [rows] = await dbPool.execute(sql, [user_id, month, year]);
        return rows;
    }
    static async getTotalExpense(user_id, month = now.getMonth() + 1, year = now.getFullYear()) {
        const sql = "SELECT SUM(amount) as amount FROM expense_transactions" +
            " WHERE user_id = ? AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?"
        const [rows] = await dbPool.execute(sql, [user_id, month, year]);
        return rows[0].amount ?? 0; // nếu có giá trị thì trả về, ngược lại trả về 0
    }
    static async getExpenseStructure(user_id, month = now.getMonth() + 1, year = now.getFullYear()) {
        const sql = "SELECT c.id as category_id, c.name as category_name, SUM(et.amount) as amount FROM expense_transactions et LEFT JOIN categories c ON et.category_id = c.id" +
            " WHERE et.user_id = ? AND MONTH(et.transaction_date) = ? AND YEAR(et.transaction_date) = ? GROUP BY c.id, c.name"
        const [rows] = await dbPool.execute(sql, [user_id, month, year]);
        return rows;
    }
    static async getEssentialAmount(user_id, month = now.getMonth() + 1, year = now.getFullYear()) {
        const sql = "SELECT SUM(et.amount) as amount FROM expense_transactions et LEFT JOIN categories c ON et.category_id = c.id" +
            " WHERE c.is_essential = 1 AND et.user_id = ? AND MONTH(et.transaction_date) = ? AND YEAR(et.transaction_date) = ?"
        const [rows] = await dbPool.execute(sql, [user_id, month, year]);
        return rows[0].amount ?? 0; // nếu có giá trị thì trả về, ngược lại trả về 0
    }
    static async addExpenseTransaction(data) {
        
    }
    static async updateExpenseTransaction(data) {
        
    }
    static async deleteExpenseTransaction(id) {
        
    }   
}