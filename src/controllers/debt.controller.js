import DebtModel from "../models/debt.model";
const DEBT_FIELDS = new Set([
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
    "due_day_of_month"
]);

const REQUIRED_DEBT_FIELDS = [
    "user_id",
    "lender_name",
    "debt_type",
    "total_amount",
    "remaining_amount",
    "monthly_payment",
    "start_date"
];

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

const validateDebt = (body) => {
    const errors = {};
    const valid_data = {};

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return {
            errors: { body: "Request body phải là một object JSON" },
            valid_data
        };
    }

    for (const [field, value] of Object.entries(body)) {
        if (!DEBT_FIELDS.has(field)) {
            errors[field] = "Trường không được hỗ trợ khi tạo khoản nợ";
            continue;
        }

        let errorMessage;
        if (field === "user_id" && (!Number.isInteger(value) || value <= 0)) {
            errorMessage = "user_id phải là số nguyên dương";
        } else if (field === "lender_name"
            && (typeof value !== "string" || value.trim().length === 0 || value.length > 150)) {
            errorMessage = "lender_name phải là chuỗi không rỗng, tối đa 150 ký tự";
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

    for (const field of REQUIRED_DEBT_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(body, field)) {
            errors[field] = `${field} là trường bắt buộc`;
        }
    }

    return { errors, valid_data };
};

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
        const validation = validateDebt(req.body);
        if (Object.keys(validation.errors).length > 0) {
            return res.status(400).json({
                status: "false",
                code: "INVALID_REQUEST",
                message: "Dữ liệu gửi lên không hợp lệ",
                errors: validation.errors
            });
        }
        const newDebt = await DebtModel.createDebt(validation.valid_data);
        res.status(201).json({ status: "success", message: "Tạo nợ thành công", data: newDebt });
    } catch (error) {
        console.error('Failed to create debt:', error);
        return res.status(500).json({
            status: "false",
            code: "INTERNAL_SERVER_ERROR",
            message: "Có lỗi ở phía máy chủ"
        });
    }
}