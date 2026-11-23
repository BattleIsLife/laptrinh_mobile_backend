import ProfileModel from '../models/user.model.js';
const PROFILE_FIELDS = new Set([
    'full_name',
    'phone',
    'email',
    'date_of_birth',
    'occupation',
    'number_of_dependents',
    'monthly_income'
]);
const isValidUserId = (id) => {
    const userId = String(id);
    if (!/^[1-9]\d*$/.test(userId)) {
        return false;
    }
    return BigInt(id) <= 18446744073709551615n;
};

const isValidDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (year < 1000) {
        return false;
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
};

const validateChanges = (body) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return {
            errors: { body: 'Request body phải là một object JSON' },
            valid_data: {}
        };
    }

    const entries = Object.entries(body);
    if (entries.length === 0) {
        return {
            errors: { body: 'Ít nhất một trường hợp lệ là bắt buộc' },
            valid_data: {}
        };
    }

    const errors = {};
    const valid_data = {};

    for (const [field, value] of entries) {
        if (!PROFILE_FIELDS.has(field)) {
            errors[field] = `Trường không được hỗ trợ. Chỉ được gửi: [${Array.from(PROFILE_FIELDS).join(', ')}]`;
            continue;
        }
        let errorMessage;
        if (field === 'full_name'
            && (typeof value !== 'string' || value.trim().length === 0 || value.length > 100)) {
            errorMessage = 'full_name phải là một chuỗi không rỗng, tối đa 100 ký tự';
        } else if (field === 'date_of_birth' && value !== null && !isValidDate(value)) {
            errorMessage = 'date_of_birth phải là một chuỗi ngày hợp lệ theo định dạng YYYY-MM-DD hoặc null';
        } else if (field === 'occupation'
            && value !== null
            && (typeof value !== 'string' || value.length > 100)) {
            errorMessage = 'occupation phải là một chuỗi tối đa 100 ký tự hoặc null';
        } else if (field === 'number_of_dependents'
            && (!Number.isInteger(value) || value < 0 || value > 255)) {
            errorMessage = 'number_of_dependents phải là một số nguyên không âm, tối đa 255';
        } else if (field === 'monthly_income'
            && (typeof value !== 'string'
                || !/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/.test(value))) {
            errorMessage = 'monthly_income phải là chuỗi số tiền không âm, tối đa 13 chữ số nguyên và 2 chữ số thập phân';
        } else if (field === 'phone'
            && (typeof value !== 'string' || !/^\+?\d{10,15}$/.test(value))) {
            errorMessage = 'phone phải là chuỗi số điện thoại hợp lệ, từ 10 đến 15 chữ số, có thể bắt đầu bằng dấu +';
        } else if (field === 'email'
            && (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
            errorMessage = 'email phải là chuỗi địa chỉ email hợp lệ';
        }
        if (errorMessage) {
            errors[field] = errorMessage;
        } else {
            valid_data[field] = value;
        }
    }

    return { errors, valid_data };
};

export const getMyProfile = async (req, res) => {
    const userId = req.user?.id;
    if (!isValidUserId(userId)) {
        return res.status(401).json({ status: 'false', message: 'Token không chứa ID người dùng hợp lệ' });
    }

    try {
        const profile = await ProfileModel.getProfile(userId);
        if (!profile) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        return res.status(200).json({ data: profile });
    } catch (error) {
        console.error('Failed to get profile:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

export const updateMyProfile = async (req, res) => {
    const userId = req.user?.id;
    if (!isValidUserId(userId)) {
        return res.status(401).json({ status: 'false', message: 'Token không chứa ID người dùng hợp lệ' });
    }

    const validation = validateChanges(req.body);
    if (Object.keys(validation.errors).length > 0) {
        return res.status(400).json({
            status: 'false',
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            errors: validation.errors
        });
    }

    try {
        await ProfileModel.updateProfile(userId, validation.valid_data);
        const profile = await ProfileModel.getProfile(userId);
        if (!profile) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        return res.status(200).json({
            message: 'Hồ sơ đã được cập nhật thành công',
            data: profile
        });
    } catch (error) {
        console.error('Failed to update profile:', error);
        return res.status(500).json({
            status: 'false',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Lỗi máy chủ nội bộ'
        });
    }
};
