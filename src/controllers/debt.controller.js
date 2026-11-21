import DebtModel from "../models/debt.model";
const DEBT_FIELDS = new Set([
    "id",
    "debt_id",
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
  
export const getDebts = async (req, res) => {
    try {
        const debts = await DebtModel.getDebts();
        res.status(200).json({ status: "success", message: "Lấy toàn bộ nợ thành công", data: debts });
    } catch (error) {
        console.error('Failed to get debts:', error);
        res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}
export const createDebt = async (req, res) => {
    try {
        const debtData = req.body;
        const missingFields = Array.from(DEBT_FIELDS).filter(field => !(field in debtData));
        if (missingFields.length > 0) {
            return res.status(400).json({ status: "false", message: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}` });
        }
        if (typeof debtData.total_amount !== 'number' || debtData.total_amount < 0) {
            return res.status(400).json({ status: "false", message: "Tổng nợ ban đầu phải là một số không âm" });
        }
        const newDebt = await DebtModel.createDebt(debtData);
        res.status(201).json({ status: "success", message: "Tạo nợ thành công", data: newDebt });
    } catch (error) {
        console.error('Failed to create debt:', error);
        res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}