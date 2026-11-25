import pool from "../config/database.js";

const ASSET_FIELD = new Set([
    'asset_type',
    'name',
    'current_value',
])

export default class AssetModel {
    // Lấy danh sách các tài sản
    static async readAll(user_id, page, month, year){
        let sql = "SELECT * FROM assets WHERE user_id = ? ";
        let additional_conditions = [];
        let params = [user_id];
        if(month && year)
        {
            sql += " AND MONTH(created_at) = ? AND YEAR(created_at) = ?";
            params.push(month, year);
        }

        page = (page && page > 0) ? page : 1;
        const offset = (page - 1) * 10;
        sql += ` LIMIT 10 OFFSET ${offset}`;
        params.push(page);
        console.log(sql)

        const [rows] = await pool.execute(sql, params);
        return rows ?? null;
    };

    static async readById(user_id, asset_id){
        const sql = "SELECT * FROM assets WHERE user_id = ? AND id = ?";
        const [rows] = await pool.execute(sql, [user_id, asset_id]);
        return rows ?? null;
    };


    // Thêm tài sản
    static async create(user_id, asset_type, name, current_value){
        const sql = `INSERT INTO assets(user_id, asset_type, name, current_value) 
                                 VALUES(?, ?, ?, ?)`;
        const [rows] = await pool.execute(sql, [user_id, asset_type, name, current_value]);
        return rows.insertId ?? null;
    };


    // Sửa tài sản
    static async update(asset_id, user_id, changes){
        const entries = Object.entries(changes).filter(([field]) => ASSET_FIELD.has(field));
        if (entries.length === 0) {
            throw new Error('Ít nhất một trường là bắt buộc');
        }

        const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
        const values = entries.map(([, value]) => value);
        const [result] = await pool.execute(
            `UPDATE assets SET ${setClause} WHERE id = ? AND user_id = ?`,
            [...values, asset_id, user_id]
        );

        return result.affectedRows ?? null;
    };


    // Xóa tài sản
    static async delete(asset_id, user_id){
        const sql = `DELETE FROM assets WHERE id = ? AND user_id = ?`;

        const [rows] = await pool.execute(sql, [asset_id, user_id]);
        return rows.affectedRows ?? null;
    }
}