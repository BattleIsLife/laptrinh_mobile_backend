import pool from "../config/database.js";
import DebtModel from "./debt.model.js";
import { fromMinorUnits, toMinorUnits } from "../utils/debt_validation.js";

export default class DebtPaymentModel {
    static async getDebtPayments(userId) {
        await DebtModel.refreshStatuses(userId);
        const [rows] = await pool.execute(
            `SELECT payment.*
             FROM debt_payments AS payment
             JOIN debts AS debt ON debt.id = payment.debt_id
             WHERE debt.user_id = ?
             ORDER BY payment.due_date DESC, payment.id DESC`,
            [userId]
        );
        return rows;
    }

    static async getDebtPaymentById(id, userId) {
        await DebtModel.refreshStatuses(userId);
        const [rows] = await pool.execute(
            `SELECT payment.*
             FROM debt_payments AS payment
             JOIN debts AS debt ON debt.id = payment.debt_id
             WHERE payment.id = ? AND debt.user_id = ?`,
            [id, userId]
        );
        return rows[0] || null;
    }

    static async createDebtPayment(debtId, userId, paymentData) {
        const connection = await pool.getConnection();
        let transactionStarted = false;
        try {
            await connection.beginTransaction();
            transactionStarted = true;

            const [debtRows] = await connection.execute(
                `SELECT remaining_amount
                 FROM debts
                 WHERE id = ? AND user_id = ?
                 FOR UPDATE`,
                [debtId, userId]
            );
            if (debtRows.length === 0) {
                await connection.rollback();
                transactionStarted = false;
                return null;
            }

            const [scheduledRows] = await connection.execute(
                `SELECT COALESCE(SUM(amount_due - amount_paid), 0) AS scheduled_amount
                 FROM debt_payments
                 WHERE debt_id = ? AND amount_paid < amount_due`,
                [debtId]
            );
            const debtRemaining = toMinorUnits(debtRows[0].remaining_amount);
            const alreadyScheduled = toMinorUnits(scheduledRows[0].scheduled_amount);
            const newScheduleAmount = toMinorUnits(paymentData.amount_due);
            if (alreadyScheduled + newScheduleAmount > debtRemaining) {
                const error = new Error("Tổng các kỳ thanh toán chưa trả không được vượt dư nợ còn lại");
                error.code = "SCHEDULE_EXCEEDS_BALANCE";
                throw error;
            }

            const [result] = await connection.execute(
                `INSERT INTO debt_payments (debt_id, due_date, amount_due)
                 VALUES (?, ?, ?)`,
                [debtId, paymentData.due_date, String(paymentData.amount_due)]
            );
            await connection.commit();
            transactionStarted = false;
            return this.getDebtPaymentById(result.insertId, userId);
        } catch (error) {
            if (transactionStarted) {
                await connection.rollback();
            }
            throw error;
        } finally {
            connection.release();
        }
    }

    static async recordPayment(paymentId, userId, paymentAmount) {
        const connection = await pool.getConnection();
        let transactionStarted = false;
        try {
            await connection.beginTransaction();
            transactionStarted = true;

            const [paymentReference] = await connection.execute(
                `SELECT payment.debt_id
                 FROM debt_payments AS payment
                 JOIN debts AS debt ON debt.id = payment.debt_id
                 WHERE payment.id = ? AND debt.user_id = ?`,
                [paymentId, userId]
            );
            if (paymentReference.length === 0) {
                await connection.rollback();
                transactionStarted = false;
                return null;
            }

            const debtId = paymentReference[0].debt_id;
            const [debtRows] = await connection.execute(
                `SELECT remaining_amount
                 FROM debts
                 WHERE id = ? AND user_id = ?
                 FOR UPDATE`,
                [debtId, userId]
            );
            const [paymentRows] = await connection.execute(
                `SELECT id, debt_id, due_date, amount_due, amount_paid
                 FROM debt_payments
                 WHERE id = ? AND debt_id = ?
                 FOR UPDATE`,
                [paymentId, debtId]
            );
            if (debtRows.length === 0 || paymentRows.length === 0) {
                await connection.rollback();
                transactionStarted = false;
                return null;
            }

            const payment = paymentRows[0];
            const amountDue = toMinorUnits(payment.amount_due);
            const amountAlreadyPaid = toMinorUnits(payment.amount_paid);
            const remainingForPayment = amountDue - amountAlreadyPaid;
            const remainingDebt = toMinorUnits(debtRows[0].remaining_amount);
            const amountToRecord = toMinorUnits(paymentAmount);

            if (remainingForPayment <= 0n) {
                const error = new Error("Kỳ thanh toán này đã được thanh toán đủ");
                error.code = "PAYMENT_ALREADY_SETTLED";
                throw error;
            }
            if (amountToRecord > remainingForPayment) {
                const error = new Error("Số tiền trả không được lớn hơn số tiền còn thiếu của kỳ này");
                error.code = "PAYMENT_EXCEEDS_INSTALLMENT";
                throw error;
            }
            if (amountToRecord > remainingDebt) {
                const error = new Error("Số tiền trả không được lớn hơn dư nợ còn lại");
                error.code = "PAYMENT_EXCEEDS_BALANCE";
                throw error;
            }

            const totalPaid = amountAlreadyPaid + amountToRecord;
            const [lateRows] = await connection.execute(
                `SELECT GREATEST(DATEDIFF(CURDATE(), ?), 0) AS days_late,
                        (CURDATE() > ?) AS is_late`,
                [payment.due_date, payment.due_date]
            );
            const daysLate = Number(lateRows[0].days_late);
            const isLate = Boolean(Number(lateRows[0].is_late));
            const paymentStatus = totalPaid >= amountDue
                ? (isLate ? "LATE" : "PAID")
                : (isLate ? "LATE" : "PENDING");
            const newRemainingDebt = remainingDebt - amountToRecord;

            await connection.execute(
                `UPDATE debt_payments
                 SET amount_paid = ?, payment_date = CURDATE(),
                     is_late = ?, days_late = ?, status = ?
                 WHERE id = ?`,
                [
                    fromMinorUnits(totalPaid),
                    isLate,
                    daysLate,
                    paymentStatus,
                    paymentId
                ]
            );

            const [overdueRows] = await connection.execute(
                `SELECT COUNT(*) AS overdue_count
                 FROM debt_payments
                 WHERE debt_id = ? AND due_date < CURDATE()
                   AND amount_paid < amount_due`,
                [debtId]
            );
            const debtStatus = newRemainingDebt === 0n
                ? "SETTLED"
                : (Number(overdueRows[0].overdue_count) > 0 ? "OVERDUE" : "ACTIVE");
            await connection.execute(
                `UPDATE debts SET remaining_amount = ?, status = ?
                 WHERE id = ? AND user_id = ?`,
                [fromMinorUnits(newRemainingDebt), debtStatus, debtId, userId]
            );

            const [updatedPaymentRows] = await connection.execute(
                "SELECT * FROM debt_payments WHERE id = ?",
                [paymentId]
            );
            await connection.commit();
            transactionStarted = false;
            return {
                payment: updatedPaymentRows[0],
                debt: {
                    id: debtId,
                    remaining_amount: fromMinorUnits(newRemainingDebt),
                    status: debtStatus
                }
            };
        } catch (error) {
            if (transactionStarted) {
                await connection.rollback();
            }
            throw error;
        } finally {
            connection.release();
        }
    }
}
