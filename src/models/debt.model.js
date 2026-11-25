import pool from "../config/database.js";
import { dateToString } from "../utils/debt_validation.js";

const DEBT_UPDATE_FIELDS = new Set([
    "lender_name",
    "debt_type",
    "total_amount",
    "credit_limit",
    "monthly_payment",
    "interest_rate",
    "start_date",
    "end_date",
    "due_day_of_month"
]);

export default class DebtModel {
    static async refreshStatuses(userId) {
        await pool.execute(
            `UPDATE debt_payments AS payment
             JOIN debts AS debt ON debt.id = payment.debt_id
             SET payment.status = CASE
                     WHEN payment.amount_paid = 0 THEN 'MISSED'
                     ELSE 'LATE'
                 END,
                 payment.is_late = TRUE,
                 payment.days_late = GREATEST(DATEDIFF(CURDATE(), payment.due_date), 0)
             WHERE debt.user_id = ?
               AND payment.due_date < CURDATE()
               AND payment.amount_paid < payment.amount_due`,
            [userId]
        );
        await pool.execute(
            `UPDATE debts AS debt
             SET status = CASE
                 WHEN debt.remaining_amount = 0 THEN 'SETTLED'
                 WHEN EXISTS (
                     SELECT 1 FROM debt_payments AS payment
                     WHERE payment.debt_id = debt.id
                       AND payment.due_date < CURDATE()
                       AND payment.amount_paid < payment.amount_due
                 ) THEN 'OVERDUE'
                 ELSE 'ACTIVE'
             END
             WHERE debt.user_id = ?`,
            [userId]
        );
    }

    static async getDebts(userId) {
        await this.refreshStatuses(userId);
        const [rows] = await pool.execute(
            "SELECT * FROM debts WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        return rows;
    }

    static async getDebtById(id, userId) {
        await this.refreshStatuses(userId);
        const [rows] = await pool.execute(
            "SELECT * FROM debts WHERE id = ? AND user_id = ?",
            [id, userId]
        );
        return rows[0] || null;
    }

    static async createDebt(userId, debtData) {
        const remainingAmount = Number(debtData.remaining_amount);
        const status = remainingAmount === 0 ? "SETTLED" : "ACTIVE";
        const [result] = await pool.execute(
            `INSERT INTO debts (
                user_id, lender_name, debt_type, total_amount, remaining_amount,
                credit_limit, monthly_payment, interest_rate, start_date, end_date,
                due_day_of_month, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                debtData.lender_name,
                debtData.debt_type,
                String(debtData.total_amount),
                String(debtData.remaining_amount),
                String(debtData.credit_limit ?? 0),
                String(debtData.monthly_payment),
                String(debtData.interest_rate ?? 0),
                debtData.start_date,
                debtData.end_date ?? null,
                debtData.due_day_of_month ?? 1,
                status
            ]
        );
        return this.getDebtById(result.insertId, userId);
    }

    static async updateDebt(id, userId, changes) {
        const entries = Object.entries(changes).filter(([field]) => DEBT_UPDATE_FIELDS.has(field));
        if (entries.length === 0) {
            throw new Error("Không có trường hợp lệ để cập nhật.");
        }

        const setClause = entries.map(([field]) => `${field} = ?`).join(", ");
        const values = entries.map(([, value]) => value instanceof Date
            ? dateToString(value)
            : typeof value === "number" ? String(value) : value);
        const [result] = await pool.execute(
            `UPDATE debts SET ${setClause} WHERE id = ? AND user_id = ?`,
            [...values, id, userId]
        );
        return result.affectedRows;
    }

    static async deleteDebt(id, userId) {
        const [result] = await pool.execute(
            "DELETE FROM debts WHERE id = ? AND user_id = ?",
            [id, userId]
        );
        return result.affectedRows;
    }
}
