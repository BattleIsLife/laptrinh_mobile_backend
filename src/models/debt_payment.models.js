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
    static async createDebtPayment(debtPaymentData) {
        const sql = 'INSERT INTO debt_payments (debt_payment_id, payment_date, due_date, amount_due, amount_paid, is_late, days_late, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [
            debtPaymentData.debt_payment_id,
            debtPaymentData.payment_date,
            debtPaymentData.due_date,
            debtPaymentData.amount_due,
            debtPaymentData.amount_paid,
            debtPaymentData.is_late,
            debtPaymentData.days_late,
            debtPaymentData.status
        ];
        const result = await pool.query(sql, values);
        return result[0];
    }
}
