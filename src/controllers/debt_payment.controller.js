import DebtModel from "../models/debt.model.js";
import DebtPaymentModel from "../models/debt_payment.model.js";
import {
    dateToString,
    isValidDate,
    isValidDecimalNumber,
    isValidId,
    toMinorUnits
} from "../utils/debt_validation.js";

const validationResponse = (res, errors) => res.status(400).json({
    status: "false",
    code: "INVALID_REQUEST",
    message: "Dữ liệu gửi lên không hợp lệ",
    errors
});

const validateSchedule = (body) => {
    const errors = Object.create(null);
    const valid_data = {};

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { errors: { body: "Request body phải là một object JSON" }, valid_data };
    }

    for (const [field, value] of Object.entries(body)) {
        if (field === "due_date") {
            if (!isValidDate(value)) {
                errors[field] = "due_date phải là ngày hợp lệ theo định dạng YYYY-MM-DD";
            } else {
                valid_data[field] = value;
            }
        } else if (field === "amount_due") {
            if (!isValidDecimalNumber(value) || value <= 0) {
                errors[field] = "amount_due phải là số dương, tối đa 13 chữ số nguyên và 2 chữ số thập phân";
            } else {
                valid_data[field] = value;
            }
        } else {
            errors[field] = "Chỉ được gửi due_date và amount_due khi tạo kỳ thanh toán";
        }
    }

    for (const field of ["due_date", "amount_due"]) {
        if (!Object.prototype.hasOwnProperty.call(body, field)) {
            errors[field] = `${field} là trường bắt buộc`;
        }
    }

    return { errors, valid_data };
};

const validatePaymentRecord = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { errors: { body: "Request body phải là một object JSON" }, amount_paid: null };
    }

    const errors = Object.create(null);
    for (const field of Object.keys(body)) {
        if (field !== "amount_paid") {
            errors[field] = "Chỉ được gửi amount_paid khi ghi nhận thanh toán";
        }
    }
    if (!Object.prototype.hasOwnProperty.call(body, "amount_paid")) {
        errors.amount_paid = "amount_paid là trường bắt buộc";
    } else if (!isValidDecimalNumber(body.amount_paid) || body.amount_paid <= 0) {
        errors.amount_paid = "amount_paid phải là số dương, tối đa 13 chữ số nguyên và 2 chữ số thập phân";
    }

    return { errors, amount_paid: body.amount_paid };
};

export const refreshDebtPayments = async (req, res) => {
    const userId = req.user?.id;
    if (!isValidId(userId)) {
        return res.status(401).json({ status: "false", message: "Token không chứa ID người dùng hợp lệ" });
    }
    try {
        await DebtModel.refreshStatuses(userId);
        return res.status(200).json({ status: "success", message: "Cập nhật trạng thái các kỳ thanh toán thành công" });
    } catch (error) {
        console.error("lam moi trạng thái các kỳ thanh toán that bai:", error);
        return res.status(500).json({
            status: "false",
            code: "INTERNAL_SERVER_ERROR",
            message: "Có lỗi ở phía máy chủ"
        });
    }
}

export const getDebtPayments = async (req, res) => {
    const userId = req.user?.id;
    if (!isValidId(userId)) {
        return res.status(401).json({ status: "false", message: "Token không chứa ID người dùng hợp lệ" });
    }

    try {
        const payments = await DebtPaymentModel.getDebtPayments(userId);
        return res.status(200).json({ status: "success", data: payments });
    } catch (error) {
        console.error("Failed to get debt payments:", error);
        return res.status(500).json({
            status: "false",
            code: "INTERNAL_SERVER_ERROR",
            message: "Có lỗi ở phía máy chủ"
        });
    }
};

export const getDebtPaymentById = async (req, res) => {
    const userId = req.user?.id;
    if (!isValidId(userId)) {
        return res.status(401).json({ status: "false", message: "Token không chứa ID người dùng hợp lệ" });
    }
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ status: "false", code: "INVALID_REQUEST", message: "ID kỳ thanh toán không hợp lệ" });
    }

    try {
        const payment = await DebtPaymentModel.getDebtPaymentById(req.params.id, userId);
        if (!payment) {
            return res.status(404).json({ status: "false", message: "Không tìm thấy kỳ thanh toán" });
        }
        return res.status(200).json({ status: "success", data: payment });
    } catch (error) {
        console.error("Failed to get debt payment:", error);
        return res.status(500).json({
            status: "false",
            code: "INTERNAL_SERVER_ERROR",
            message: "Có lỗi ở phía máy chủ"
        });
    }
};

export const createDebtPayment = async (req, res) => {
    const userId = req.user?.id;
    if (!isValidId(userId)) {
        return res.status(401).json({ status: "false", message: "Token không chứa ID người dùng hợp lệ" });
    }
    if (!isValidId(req.params.debtId)) {
        return res.status(400).json({ status: "false", code: "INVALID_REQUEST", message: "ID khoản nợ không hợp lệ" });
    }

    const validation = validateSchedule(req.body);
    if (Object.keys(validation.errors).length > 0) {
        return validationResponse(res, validation.errors);
    }

    try {
        const debt = await DebtModel.getDebtById(req.params.debtId, userId);
        if (!debt) {
            return res.status(404).json({ status: "false", message: "Không tìm thấy khoản nợ" });
        }
        if (debt.status === "SETTLED" || Number(debt.remaining_amount) <= 0) {
            return res.status(409).json({
                status: "false",
                code: "DEBT_SETTLED",
                message: "Không thể tạo kỳ thanh toán cho khoản nợ đã tất toán"
            });
        }
        if (toMinorUnits(validation.valid_data.amount_due) > toMinorUnits(debt.remaining_amount)) {
            return validationResponse(res, {
                amount_due: "amount_due không được lớn hơn remaining_amount"
            });
        }
        if (dateToString(validation.valid_data.due_date) < dateToString(debt.start_date)) {
            return validationResponse(res, {
                due_date: "due_date không được trước ngày bắt đầu khoản nợ"
            });
        }

        const payment = await DebtPaymentModel.createDebtPayment(
            req.params.debtId,
            userId,
            validation.valid_data
        );
        if (!payment) {
            return res.status(409).json({
                status: "false",
                code: "DEBT_BALANCE_CHANGED",
                message: "Dư nợ đã thay đổi; hãy tải lại khoản nợ rồi thử lại"
            });
        }
        return res.status(201).json({
            status: "success",
            message: "Tạo kỳ thanh toán thành công",
            data: payment
        });
    } catch (error) {
        if (error.code === "SCHEDULE_EXCEEDS_BALANCE") {
            return res.status(409).json({
                status: "false",
                code: error.code,
                message: error.message
            });
        }
        if (error.code === "DUPLICATE_PAYMENT_SCHEDULE") {
            return res.status(409).json({
                status: "false",
                code: error.code,
                message: error.message
            });
        }
        console.error("Failed to create debt payment:", error);
        return res.status(500).json({
            status: "false",
            code: "INTERNAL_SERVER_ERROR",
            message: "Có lỗi ở phía máy chủ"
        });
    }
};

export const recordDebtPayment = async (req, res) => {
    const userId = req.user?.id;
    if (!isValidId(userId)) {
        return res.status(401).json({ status: "false", message: "Token không chứa ID người dùng hợp lệ" });
    }
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ status: "false", code: "INVALID_REQUEST", message: "ID kỳ thanh toán không hợp lệ" });
    }

    const validation = validatePaymentRecord(req.body);
    if (Object.keys(validation.errors).length > 0) {
        return validationResponse(res, validation.errors);
    }

    try {
        const result = await DebtPaymentModel.recordPayment(
            req.params.id,
            userId,
            validation.amount_paid
        );
        if (!result) {
            return res.status(404).json({ status: "false", message: "Không tìm thấy kỳ thanh toán" });
        }
        return res.status(200).json({
            status: "success",
            message: "Ghi nhận thanh toán thành công",
            data: result
        });
    } catch (error) {
        if ([
            "PAYMENT_ALREADY_SETTLED",
            "PAYMENT_EXCEEDS_INSTALLMENT",
            "PAYMENT_EXCEEDS_BALANCE"
        ].includes(error.code)) {
            return res.status(409).json({
                status: "false",
                code: error.code,
                message: error.message
            });
        }
        console.error("Failed to record debt payment:", error);
        return res.status(500).json({
            status: "false",
            code: "INTERNAL_SERVER_ERROR",
            message: "Có lỗi ở phía máy chủ"
        });
    }
};
