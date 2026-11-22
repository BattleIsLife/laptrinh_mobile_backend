import DebtPaymentModel from "../models/debt_payment.model";
const DEBT_PAYMENT_FIELDS = new Set([
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
export const getDebtPayments = async (req, res) => {
    try {
        const debtPayments = await DebtPaymentModel.getDebtPayments();
        res.status(200).json({ status: "success", message: "Lấy toàn bộ thanh toán nợ thành công", data: debtPayments });
    } catch (error) {
        console.error('Lay danh sách thanh toán nợ thất bại:', error);
        res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}
export const getDebtPaymentById = async (req, res) => {
    try {
        const id = req.params.id;
        const debtPayment = await DebtPaymentModel.getDebtPaymentById(id);
        if(!debtPayment) {
            return res.status(404).json({ status: "false", message: "Không tìm thấy thanh toán nợ với ID đã cho" });
        }
        res.status(200).json({ status: "success", message: "Lấy thanh toán nợ thành công", data: debtPayment });
    } catch (error) {
        console.error('Lấy thanh toán nợ thất bại:', error);
        res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}