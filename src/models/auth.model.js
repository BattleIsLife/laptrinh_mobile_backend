import pool from '../config/database.js';

const dbPool = pool;

export default class AuthModel {
    static async getUserByPhone(phone) {
        const sql = "SELECT * FROM users WHERE phone = ?";
        const [rows] = await dbPool.execute(sql, [phone]);
        return rows[0];
    }
    static async getUserByEmail(email) {
        const sql = "SELECT * FROM users WHERE email = ?";
        const [rows] = await dbPool.execute(sql, [email]);
        return rows[0];
    }
    static async createUser(full_name, email, phone, password) {
        const sql = "INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)";
        const [result] = await dbPool.execute(sql, [full_name, email, phone, password]);
        return result.insertedId;
    }
}