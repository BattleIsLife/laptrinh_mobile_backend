import pool from "../config/database";
const debt_fields = new Set([
"id",
"user_id",
"lender_name",
"debt_type",
"total_amount",
"remaining_amount",
"credit_limit",
"monthly_payment",
"interest_rate",
"start_date",
"end_date",
"due_day_of_month",
"status",
"created_at",
"updated_at"            
]);
export default class DebtModel {
    static async getDebts() {
        const sql = "select * from debts";
        const rows = await pool.query(sql);
        return rows[0];
    }
    static async getDebtById(id) {
        const sql = "select * from debts where id = ?";
        const rows = await pool.query(sql, [id]);
        return rows[0][0];
    }
    static async createDebt(debtData) {
        const sql = 'INSERT INTO debts (user_id, lender_name, debt_type, total_amount, remaining_amount, credit_limit, monthly_payment, interest_rate, start_date, end_date, due_day_of_month) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [
            debtData.user_id,
            debtData.lender_name,
            debtData.debt_type,
            debtData.total_amount,
            debtData.remaining_amount,
            debtData.credit_limit,
            debtData.monthly_payment,
            debtData.interest_rate,
            debtData.start_date,
            debtData.end_date,
            debtData.due_day_of_month
        ];
        const result = await pool.query(sql, values);
        return result[0];
    }
    static async updateDebt(id, debtData) {
        const entries = Object.entries(debtData).filter(([field]) => debt_fields.has(field));
        if (entries.length === 0) {
            throw new Error("không có trường nào hợp lệ để cập nhật.");
        }
        const setClause = entries.map(([field]) => `${field} = ?`).join(", ");
        const values = entries.map(([, value]) => value);
        values.push(id);
        const sql = `UPDATE debts SET ${setClause} WHERE id = ?`;
        const result = await pool.query(sql, values);
        return result[0];
    }
    static async deleteDebt(id) {
        const sql = "DELETE FROM debts WHERE id = ?";
        const result = await pool.query(sql, [id]);
        return result[0];
    }
}
