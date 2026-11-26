import pool from "../config/database.js";
import {
    dateToString,
    fromMinorUnits,
    toMinorUnits
} from "../utils/debt_validation.js";

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
        const connection = await pool.getConnection();
        let transactionStarted = false;
        try {
            await connection.beginTransaction();
            transactionStarted = true;
        const remainingAmount = toMinorUnits(debtData.remaining_amount);
        const monthlyPayment = toMinorUnits(debtData.monthly_payment);
        if (remainingAmount > 0n && monthlyPayment <= 0n) {
            const error = new Error("monthly_payment phải lớn hơn 0 khi còn dư nợ");
            error.code = "INVALID_MONTHLY_PAYMENT";
            throw error;
        }
        const status = remainingAmount === 0n ? "SETTLED" : "ACTIVE";
        const [result] = await connection.execute(
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
            if (remainingAmount > 0n) {
                const debtId = result.insertId;
                const dueDay = Number(debtData.due_day_of_month ?? 1);
                const startDate = new Date(`${debtData.start_date}T00:00:00Z`);
                const endDate = debtData.end_date
                    ? new Date(`${debtData.end_date}T00:00:00Z`)
                    : null;
                let scheduledRemaining = remainingAmount;
                let year = startDate.getUTCFullYear();
                let month = startDate.getUTCMonth() + 1;

                while (scheduledRemaining > 0n) {
                    const firstDayNextMonth = new Date(Date.UTC(year, month, 1));
                    year = firstDayNextMonth.getUTCFullYear();
                    month = firstDayNextMonth.getUTCMonth();

                    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
                    const dueDate = new Date(Date.UTC(year, month, Math.min(dueDay, lastDay)));
                    if (endDate && dueDate > endDate) {
                        break;
                    }

                    const amountDue = scheduledRemaining < monthlyPayment
                        ? scheduledRemaining
                        : monthlyPayment;
                    await connection.execute(
                        `INSERT INTO debt_payments (debt_id, due_date, amount_due)
                         VALUES (?, ?, ?)`,
                        [
                            debtId,
                            dueDate.toISOString().slice(0, 10),
                            fromMinorUnits(amountDue)
                        ]
                    );
                    scheduledRemaining -= amountDue;

                    if (!endDate && scheduledRemaining === 0n) {
                        break;
                    }
                    month += 1;
                }
            }

            await connection.commit();
            transactionStarted = false;
            return this.getDebtById(result.insertId, userId);
        } catch (error) {
            if (transactionStarted) {
                await connection.rollback();
            }
            throw error;
        } finally {
            connection.release();
        }
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
