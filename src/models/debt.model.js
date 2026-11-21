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
}
