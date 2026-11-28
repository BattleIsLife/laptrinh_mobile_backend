import pool from '../config/database.js';

const dbPool = pool;

export default class ExpenseCategoryModel {
    static async countPaidDebtPayment(user_id) {
        // Đếm số thanh toán nợ được ghi nhận là đã thanh toán
        const paid_status = 'PAID';
        const sql = "SELECT COUNT(db.id) as count FROM debts d LEFT JOIN debt_payments db ON d.id = db.debt_id" +
            " WHERE d.user_id = ? AND db.status = ? ";
        const [rows] = await dbPool.execute(sql, [user_id, paid_status]);
        return rows[0].count;
    }
    static async countNotPendingDebtPayment(user_id) {
        // Đếm số thanh toán nợ được không ở trạng thái Pending (là các khoản có status Paid, Late, Missed)
        const paid_status = 'PAID';
        const late_status = 'LATE';
        const missed_status = 'MISSED';
        const sql = "SELECT COUNT(db.id) as count FROM debts d LEFT JOIN debt_payments db ON d.id = db.debt_id" +
            " WHERE d.user_id = ? AND db.status IN (?, ?, ?)";
        const [rows] = await dbPool.execute(sql, [user_id, paid_status, late_status, missed_status]);
        return rows[0].count;
    }
    static async getSumCurrentBalance(user_id) {
        // Tổng dư nợ các thẻ đang hoạt động trong credit_accounts
        const active_status = 'ACTIVE';
        const sql = "SELECT SUM(current_balance) as sum FROM credit_accounts WHERE user_id = ? AND status = ?";
        const [rows] = await dbPool.execute(sql, [user_id, active_status]);
        return rows[0].sum;
    }
    static async getSumCreditLimit(user_id) {
        // Tổng hạn mức các thẻ đang hoạt động trong credit_accounts
        const active_status = 'ACTIVE';
        const sql = "SELECT SUM(credit_limit) as sum FROM credit_accounts WHERE user_id = ? AND status = ?";
        const [rows] = await dbPool.execute(sql, [user_id, active_status]);
        return rows[0].sum;
    }
    static async getOldestCreditAccount(user_id) {
        // Lấy application_date của tài khoản tín dụng có ngày mở sớm nhất và đang hoạt động
        const active_status = 'ACTIVE';
        const sql = "SELECT MIN(DATE_FORMAT(opened_date, '%Y-%m-%d')) as oldest_opened_date FROM credit_accounts WHERE user_id = ? AND status = ?";
        const [rows] = await dbPool.execute(sql, [user_id, active_status]);
        return rows[0].oldest_opened_date ?? null;
    }
    static async getDebtMix(user_id) {
        // Lấy số khoản vay khác nhau có trạng thái ACTIVE (đang có 4 loại khác nhau trong CSDL)
        const active_status = 'ACTIVE';
        const sql = "SELECT COUNT(DISTINCT(debt_type)) as count FROM debts WHERE user_id = ? AND status = ?";
        const [rows] = await dbPool.execute(sql, [user_id, active_status]);
        return rows[0].count;
    }
    static async getCreditAccountMix(user_id) {
        // Lấy số loại tài khoản tín dụng khác nhau có trạng thái ACTIVE (đang có 2 loại khác nhau trong CSDL)
        const active_status = 'ACTIVE';
        const sql = "SELECT COUNT(DISTINCT(account_type)) as count FROM credit_accounts WHERE user_id = ? AND status = ?";
        const [rows] = await dbPool.execute(sql, [user_id, active_status]);
        return rows[0].count;
    }
    static async countNewApplication(user_id) {
        // Đếm số yêu cầu tín dụng mới trong credit_applications với ngày yêu cầu trong 365 ngày trở lại đây
        const sql = "SELECT COUNT(id) as count FROM credit_applications WHERE user_id = ? AND application_date BETWEEN DATE_SUB(NOW(), INTERVAL 365 DAY) AND NOW()";
        const [rows] = await dbPool.execute(sql, [user_id]);
        return rows[0].count;
    }
    static async saveCreditScore(data) {
        const sql = "INSERT INTO credit_scores (user_id, score, score_tier, score_breakdown) VALUES (?, ?, ?, ?)";
        const [result] = await dbPool.execute(sql, [data.user_id, data.score, data.score_tier, data.score_breakdown]);
        return result.insertId;
    }
    static async addCreditScoreRecommendation(data) {
        
    }
    static async getCreditScore(user_id) {
        const sql = "SELECT * FROM credit_scores WHERE user_id = ? AND" +  
        " calculated_at = (SELECT MAX(calculated_at) FROM credit_scores WHERE user_id = ?) ORDER BY calculated_at DESC";
        const [rows] = await dbPool.execute(sql, [user_id, user_id]);
        return rows[0];
    }
    static async getCreditScoreHistory(user_id) {
        const sql = "SELECT score, score_tier, score_breakdown, model_version, calculated_at" +
        " FROM credit_scores WHERE user_id = ? ORDER BY calculated_at DESC LIMIT 5 OFFSET 0";
        const [rows] = await dbPool.execute(sql, [user_id]);
        return rows;
    }
    static async getCreditScoreRecommendation(score_id) {

    }
}