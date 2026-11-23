import DebtPaymentModel from "../models/debt_payment.model";
const DEBT_PAYMENT_FIELDS = new Set([
    "debt_payment_id",
    "payment_date",
    "due_date",
    "amount_due",
    "amount_paid",
    "is_late",
    "days_late",
]);
const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
};

const validateDebtPayment = (body) => {
    const errors = {};
    const valid_data = {};

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return {
            errors: { body: "Request body phải là một object JSON" },
            valid_data
        };
    }

    for (const [field, value] of Object.entries(body)) {
        if (!DEBT_PAYMENT_FIELDS.has(field)) {
            errors[field] = "Trường không được hỗ trợ khi tạo khoản thanh toán nợ";
            continue;
        }

        let errorMessage;
        if (field === "debt_payment_id" && (!Number.isInteger(value) || value <= 0)) {
            errorMessage = "debt_payment_id phải là số nguyên dương";
        } else if (field === "payment_date" && !isValidDate(value)) {
            errorMessage = "payment_date phải là ngày hợp lệ theo định dạng YYYY-MM-DD";
        } else if (field === "due_date" && !isValidDate(value)) {
            errorMessage = "due_date phải là ngày hợp lệ theo định dạng YYYY-MM-DD";
        } else if (field === "amount_due"
            && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
            errorMessage = "amount_due phải là một số không âm";
        } else if (field === "amount_paid"
            && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
            errorMessage = "amount_paid phải là một số không âm";
        } else if (field === "debt_type"
            && !["CREDIT_CARD", "PERSONAL", "MORTGAGE", "INSTALLMENT"].includes(value)) {
            errorMessage = "debt_type phải là CREDIT_CARD, PERSONAL, MORTGAGE hoặc INSTALLMENT";
        } else if (["total_amount", "remaining_amount", "credit_limit", "monthly_payment", "interest_rate"].includes(field)
            && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
            errorMessage = `${field} phải là một số không âm`;
        } else if (field === "start_date" && !isValidDate(value)) {
            errorMessage = "start_date phải là ngày hợp lệ theo định dạng YYYY-MM-DD";
        } else if (field === "end_date" && value !== null && !isValidDate(value)) {
            errorMessage = "end_date phải là ngày hợp lệ theo định dạng YYYY-MM-DD hoặc null";
        } else if (field === "due_day_of_month"
            && (!Number.isInteger(value) || value < 1 || value > 31)) {
            errorMessage = "due_day_of_month phải là số nguyên từ 1 đến 31";
        }

        if (errorMessage) {
            errors[field] = errorMessage;
        } else {
            valid_data[field] = value;
        }
    }

    for (const field of REQUIRED_DEBT_PAYMENT_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(body, field)) {
            errors[field] = `${field} là trường bắt buộc`;
        }
    }

    return { errors, valid_data };
};

export const getDebtPayments = async (req, res) => {
    try {
        const debtPayments = await DebtPaymentModel.getDebtPayments();
        res.status(200).json({ status: "success", message: "Lấy toàn bộ thanh toán nợ thành công", data: debtPayments });
    } catch (error) {
        console.error('Failed to get debt payments:', error);
        res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}
export const createDebtPayment = async (req, res) => {
    try {
        const validation = validateDebtPayment(req.body);
        if (Object.keys(validation.errors).length > 0) {
            return res.status(400).json({
                status: "false",
                code: "INVALID_REQUEST",
                message: "Dữ liệu gửi lên không hợp lệ",
                errors: validation.errors
            });
        }
        const newDebtPayment = await DebtPaymentModel.createDebtPayment(validation.valid_data);
        res.status(201).json({ status: "success", message: "Tạo thanh toán nợ thành công", data: newDebtPayment });
    } catch (error) {
        console.error('Tao thanh toan no that bai:', error);
        return res.status(500).json({
            status: "false",
            code: "INTERNAL_SERVER_ERROR",
            message: "Có lỗi ở phía máy chủ"
        });
    }
}
