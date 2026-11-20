import pool from "../config/db.js";
const debt_payment_fields = new Set([
    'ma_khach_hang',
    'so_tien_tra',
    'ngay_tra',
    'ghi_chu'
]);
export default class DebtPaymentModel {
    static async getDebtPayments() {
        const sql = "select * from debt_payments";
        const rows = await pool.query(sql);
        return rows[0];
    }
    static async getDebtPaymentById(id) {
        const sql = "select * from debt_payments where id = ?";
        const rows = await pool.query(sql, [id]);
        return rows[0][0];
    }
    static async createDebtPayment(ma_khach_hang, so_tien_tra, ngay_tra, ghi_chu) {
        const sql = "insert into debt_payments (ma_khach_hang, so_tien_tra, ngay_tra, ghi_chu) values (?, ?, ?, ?)";
        const [result] = await pool.query(sql, [ma_khach_hang, so_tien_tra, ngay_tra, ghi_chu]);
        return result.insertId;
    }
    static async updateDebtPayment(id, ma_khach_hang, so_tien_tra, ngay_tra, ghi_chu) {
        const sql = "update debt_payments set ma_khach_hang = ?, so_tien_tra = ?, ngay_tra = ?, ghi_chu = ? where id = ?";
        const [result] = await pool.query(sql, [ma_khach_hang, so_tien_tra, ngay_tra, ghi_chu, id]);
        return result.affectedRows > 0;
    }
}