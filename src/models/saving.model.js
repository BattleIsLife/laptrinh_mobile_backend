import pool from "../config/database";

const SAVING_FIELD = new Set([
    "name", 
    "target_amount", 
    "monthly_contribution", 
    "target_date", 
    "interest_rate"
]);

export default class SavingModel{
    static async readAll(user_id, page = 1, month = null, year = null){
        let sql = "SELECT * FROM savings WHERE user_id = ?"
        let params = [user_id];

        if(month && year)
        {
            sql += " AND MONTH(created_at) = ? AND YEAR(created_at) = ?";
            params.push(month, year);
        }

        const offset = (page - 1)*10;
        sql += ` LIMIT 10 OFFSET ${offset}`;
        params.push(page);

        const [rows] = await pool.execute(sql, params);

        return rows ?? null;
    }

    static async readById(saving_id, user_id){
        const sql = "SELECT * FROM savings WHERE user_id = ? AND id = ?";
        const [rows] = await pool.execute(sql, [user_id, saving_id]);
        return rows[0] ?? null;
    }

    static async create(name, target_amount, monthly_contribution, target_date, interest_rate){
        const sql = `INSERT INTO savings(name, target_amount, monthly_contribution, target_date, interest_rate)
                                  VALUES(?, ?, ?, ?, ?, ?)`;
        const [rows] = await pool.execute(sql, [name, target_amount, monthly_contribution, target_date, interest_rate]);
        return rows.insertId ?? null;
    }

    static async update(saving_id, user_id, changes){
        const entries = Object.entries(changes).filter(([field]) => SAVING_FIELD.has(field));
        if (entries.length === 0) {
            throw new Error('Ít nhất một trường là bắt buộc');
        }

        const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
        const values = entries.map(([, value]) => value);
        const [result] = await pool.execute(
            `UPDATE savings SET ${setClause} WHERE id = ? AND user_id = ?`,
            [...values, saving_id, user_id]
        );

        return result.affectedRows ?? null;
    }

    static async delete(saving_id, user_id){
        const sql = `DELETE FROM savings WHERE id = ? AND user_id = ?`;

        const [rows] = await pool.execute(sql, [saving_id, user_id]);
        return rows.affectedRows ?? null;
    }
};