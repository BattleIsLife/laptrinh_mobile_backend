import DebtModel from "../models/debt.model.js";
import {
    dateToString,
    isValidDate,
    isValidDecimalNumber,
    isValidId,
    toMinorUnits
} from "../utils/debt_validation.js";

const CREATE_FIELDS = new Set([
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

const UPDATE_FIELDS = new Set([
    "lender_name",
    "debt_type",
    "total_amount",
    "credit_limit",
    "monthly_payment",
    "interest_rate",
    "start_date",
    "end_date",
    "due_day_of_month"
]);

const REQUIRED_CREATE_FIELDS = [
    "lender_name",
    "debt_type",
    "total_amount",
    "remaining_amount",
    "monthly_payment",
    "start_date"
];

const validateDebt = (body, allowedFields, requiredFields = []) => {
    const errors = Object.create(null);
    const valid_data = {};

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { errors: { body: "Request body phải là một object JSON" }, valid_data };
    }
    if (Object.keys(body).length === 0) {
        return { errors: { body: "Cần gửi ít nhất một trường" }, valid_data };
    }

    for (const [field, value] of Object.entries(body)) {
        if (!allowedFields.has(field)) {
            errors[field] = "Trường không được hỗ trợ";
            continue;
        }

        let errorMessage;
        if (field === "lender_name"
            && (typeof value !== "string" || value.trim().length === 0 || value.length > 150)) {
            errorMessage = "lender_name phải là chuỗi không rỗng, tối đa 150 ký tự";
        } else if (field === "debt_type"
            && !["CREDIT_CARD", "PERSONAL", "MORTGAGE", "INSTALLMENT"].includes(value)) {
            errorMessage = "debt_type phải là CREDIT_CARD, PERSONAL, MORTGAGE hoặc INSTALLMENT";
        } else if (["total_amount", "remaining_amount", "credit_limit", "monthly_payment"].includes(field)
            && !isValidDecimalNumber(value)) {
            errorMessage = `${field} phải là số không âm, tối đa 13 chữ số nguyên và 2 chữ số thập phân`;
        } else if (field === "interest_rate" && !isValidDecimalNumber(value, 3)) {
            errorMessage = "interest_rate phải là số từ 0 đến 999.99, tối đa 2 chữ số thập phân";
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

    for (const field of requiredFields) {
        if (!Object.prototype.hasOwnProperty.call(body, field)) {
            errors[field] = `${field} là trường bắt buộc`;
        }
    }

    return { errors, valid_data };
};

const validateDebtRelationships = (debt) => {
    const errors = {};

    if (toMinorUnits(debt.total_amount) <= 0n) {
        errors.total_amount = "total_amount phải lớn hơn 0";
    }
    if (toMinorUnits(debt.remaining_amount) > toMinorUnits(debt.total_amount)) {
        errors.remaining_amount = "remaining_amount không được lớn hơn total_amount";
    }
    if (debt.end_date
        && dateToString(debt.end_date) < dateToString(debt.start_date)) {
        errors.end_date = "end_date không được trước start_date";
    }
    if (debt.debt_type !== "CREDIT_CARD" && toMinorUnits(debt.credit_limit || 0) > 0n) {
        errors.credit_limit = "credit_limit chỉ được sử dụng cho debt_type CREDIT_CARD";
    }

    return errors;
};

const invalidRequest = (res, errors) => res.status(400).json({
    status: "false",
    code: "INVALID_REQUEST",
    message: "Dữ liệu gửi lên không hợp lệ",
    errors
});

const serverError = (res) => res.status(500).json({
    status: "false",
    code: "INTERNAL_SERVER_ERROR",
    message: "Có lỗi ở phía máy chủ"
});

const getUserId = (req) => req.user?.id;

export const getDebts = async (req, res) => {
    const userId = getUserId(req);
    if (!isValidId(userId)) {
        return res.status(401).json({ status: "false", message: "Token không chứa ID người dùng hợp lệ" });
    }
    const requestedUserId = req.params.userid ?? userId;
    if (!isValidId(requestedUserId)) {
        return invalidRequest(res, { userid: "ID người dùng không hợp lệ" });
    }
    if (String(requestedUserId) !== String(userId)) {
        return res.status(403).json({
            status: "false",
            code: "FORBIDDEN",
            message: "Không có quyền truy cập dữ liệu người dùng này"
        });
    }

    try {
        const debts = await DebtModel.getDebts(requestedUserId);
        return res.status(200).json({ status: "success", data: debts });
    } catch (error) {
        console.error("Failed to get debts:", error);
        return serverError(res);
    }
};

export const getDebtById = async (req, res) => {
    const userId = getUserId(req);
    if (!isValidId(userId)) {
        return res.status(401).json({ status: "false", message: "Token không chứa ID người dùng hợp lệ" });
    }
    if (!isValidId(req.params.userid)) {
        return invalidRequest(res, { userid: "ID người dùng không hợp lệ" });
    }
    if (String(req.params.userid) !== String(userId)) {
        return res.status(403).json({
            status: "false",
            code: "FORBIDDEN",
            message: "Không có quyền truy cập dữ liệu người dùng này"
        });
    }
    if (!isValidId(req.params.id)) {
        return invalidRequest(res, { id: "ID khoản nợ không hợp lệ" });
    }

    try {
        const debt = await DebtModel.getDebtById(req.params.id, req.params.userid);
        if (!debt) {
            return res.status(404).json({ status: "false", message: "Không tìm thấy khoản nợ" });
        }
        return res.status(200).json({ status: "success", data: debt });
    } catch (error) {
        console.error("Failed to get debt:", error);
        return serverError(res);
    }
};

export const createDebt = async (req, res) => {
    const userId = getUserId(req);
    if (!isValidId(userId)) {
        return res.status(401).json({ status: "false", message: "Token không chứa ID người dùng hợp lệ" });
    }

    const validation = validateDebt(req.body, CREATE_FIELDS, REQUIRED_CREATE_FIELDS);
    if (Object.keys(validation.errors).length > 0) {
        return invalidRequest(res, validation.errors);
    }
    const relationshipErrors = validateDebtRelationships(validation.valid_data);
    if (Object.keys(relationshipErrors).length > 0) {
        return invalidRequest(res, relationshipErrors);
    }

    try {
        const debt = await DebtModel.createDebt(userId, validation.valid_data);
        return res.status(201).json({
            status: "success",
            message: "Tạo khoản nợ thành công",
            data: debt
        });
    } catch (error) {
        console.error("Failed to create debt:", error);
        return serverError(res);
    }
};

export const updateDebt = async (req, res) => {
    const userId = getUserId(req);
    if (!isValidId(userId)) {
        return res.status(401).json({ status: "false", message: "Token không chứa ID người dùng hợp lệ" });
    }
    if (!isValidId(req.params.id)) {
        return invalidRequest(res, { id: "ID khoản nợ không hợp lệ" });
    }

    const validation = validateDebt(req.body, UPDATE_FIELDS);
    if (Object.keys(validation.errors).length > 0) {
        return invalidRequest(res, validation.errors);
    }

    try {
        const currentDebt = await DebtModel.getDebtById(req.params.id, userId);
        if (!currentDebt) {
            return res.status(404).json({ status: "false", message: "Không tìm thấy khoản nợ" });
        }

        const relationshipErrors = validateDebtRelationships({
            ...currentDebt,
            ...validation.valid_data
        });
        if (Object.keys(relationshipErrors).length > 0) {
            return invalidRequest(res, relationshipErrors);
        }

        await DebtModel.updateDebt(req.params.id, userId, validation.valid_data);
        const debt = await DebtModel.getDebtById(req.params.id, userId);
        return res.status(200).json({
            status: "success",
            message: "Cập nhật khoản nợ thành công",
            data: debt
        });
    } catch (error) {
        console.error("Failed to update debt:", error);
        return serverError(res);
    }
};

export const deleteDebt = async (req, res) => {
    const userId = getUserId(req);
    if (!isValidId(userId)) {
        return res.status(401).json({ status: "false", message: "Token không chứa ID người dùng hợp lệ" });
    }
    if (!isValidId(req.params.id)) {
        return invalidRequest(res, { id: "ID khoản nợ không hợp lệ" });
    }

    try {
        const deletedRows = await DebtModel.deleteDebt(req.params.id, userId);
        if (deletedRows === 0) {
            return res.status(404).json({ status: "false", message: "Không tìm thấy khoản nợ" });
        }
        return res.status(200).json({ status: "success", message: "Xóa khoản nợ thành công" });
    } catch (error) {
        console.error("Failed to delete debt:", error);
        return serverError(res);
    }
};
