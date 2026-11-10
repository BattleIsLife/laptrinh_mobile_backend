import pool from "../config/database";
const debt_fields = new Set([
    'ma_khach_hang',
    'so_tien_no',
    'ngay_tra',
    'ghi_chu'
]);

export default class DebtModel {
    static async getDebts() {
        const sql = "SELECT * FROM debts";
        const [rows] = await pool.execute(sql);
        return rows;
    }
    static async getDebtById(id) {
        const sql = "SELECT * FROM debts WHERE id = ?";
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }
    static async createDebt(ma_khach_hang, so_tien_no, ngay_tra, ghi_chu) {
        const sql = "INSERT INTO debts (ma_khach_hang, so_tien_no, ngay_tra, ghi_chu) VALUES (?, ?, ?, ?)";
        const [result] = await pool.execute(sql, [ma_khach_hang, so_tien_no, ngay_tra, ghi_chu]);
        return result.insertId;
    }
}

e