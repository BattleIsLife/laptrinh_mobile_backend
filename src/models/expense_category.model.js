import pool from '../config/database.js';

const dbPool = pool;

export default class ExpenseCategoryModel{
    static async getExpenseCaterogies(){
        const sql = "SELECT * FROM categories";
        const [rows] = await dbPool.query(sql);
        return rows;
    }
    static async getExpenseCaterogy(id){
        const sql = "SELECT * FROM categories WHERE id = ?";
        const [rows] = await dbPool.execute(sql, [id]);
        return rows;
    }
}