import DebtModel from "../models/debt.model";
const DEBT_FIELDS = new Set([
    'ma_khach_hang',
    'so_tien_no',
    'ngay_tra',
    'ghi_chu'
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
        if (typeof debtData.so_tien_no !== 'number' || debtData.so_tien_no < 0) {
            return res.status(400).json({ status: "false", message: "Số tiền nợ phải là một số không âm" });
        }
        const newDebt = await DebtModel.createDebt(debtData);
        res.status(201).json({ status: "success", message: "Tạo nợ thành công", data: newDebt });
    } catch (error) {
        console.error('Failed to create debt:', error);
        res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}