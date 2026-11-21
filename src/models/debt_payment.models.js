import pool from "../config/db.js";
const debt_payment_fields = new Set([
    "debt_payment_id",
    "payment_date",
    "due_date",
    "amount_due",
    "amount_paid",
    "is_late",
    "days_late",
    "status",
    "created_at"
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
}
