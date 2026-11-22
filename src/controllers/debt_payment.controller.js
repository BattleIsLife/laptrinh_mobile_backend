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
export const createDebtPayment = async (req, res) => {
    try {
        const debtPaymentData = req.body;
        const newDebtPayment = await DebtPaymentModel.createDebtPayment(debtPaymentData);
        res.status(201).json({ status: "success", message: "Tạo thanh toán nợ thành công", data: newDebtPayment });
    } catch (error) {
        console.error('Tạo thanh toán nợ thất bại:', error);
        res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}
export const updateDebtPayment = async (req, res) => {
    try {
        const id = req.params.id;
        const debtPaymentData = req.body;
        const updatedDebtPayment = await DebtPaymentModel.updateDebtPayment(id, debtPaymentData);
    }catch (error) {
        console.error('Cập nhật thanh toán nợ thất bại:', error);
        res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}
