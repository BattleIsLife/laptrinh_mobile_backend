import pool from "../config/database.js";

export default class CreditApplicationModel {
    static async getAllFromUser(user_id){
        const sql = `SELECT * FROM credit_applications WHERE user_id = ?`;
        const [rows] = await pool.execute(sql, [user_id]);
        return rows;
    }

    static async getOneFromUser(user_id, application_id){
        const sql = `SELECT * FROM credit_applications WHERE user_id = ? AND id = ?`;
        const [rows] = await pool.execute(sql, [user_id, application_id]);
        return rows[0];
    }

    static async create(user_id, name, credit_type){
        const sql = `INSERT INTO credit_applications(user_id, name, credit_type, application_date) 
                                                    VALUES(?, ?, ?, NOW())`;
        const [rows] = await pool.execute(sql, [user_id, name, credit_type]);
        return rows.insertId ?? null;
    }

    static async delete(application_id, user_id){
        const sql = `DELETE FROM credit_applications WHERE id = ? AND user_id = ?`;
        const [rows] = await pool.execute(sql, [application_id, user_id]);
        return rows.affectedRows ?? null;
    }
}