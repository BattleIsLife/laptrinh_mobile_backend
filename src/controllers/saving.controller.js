import UserModel from "../models/user.model.js";
import SavingModel from "../models/saving.model.js";

const SAVING_FIELD = new Set([
    "name", 
    "target_amount", 
    "monthly_contribution", 
    "target_date", 
    "interest_rate",
    "current_amount",
    "status"
]);

const STATUS = new Set([
    "ACTIVE",
    "COMPLETED",
    "CANCELLED"
])

const isValidId = (id) => {
    const parsedId = String(id);
    if (!/^[1-9]\d*$/.test(parsedId)) {
        return false;
    }
    return BigInt(id) <= 18446744073709551615n;
};

const getUser = async (req, res) => {
    const user_id = req.user?.id
    if (!isValidId(user_id)) {
        return res.status(401).json({ status: 'false', message: 'Token không chứa ID người dùng hợp lệ' });
    }

    try {
        const profile = await UserModel.getProfile(user_id);
        if (!profile) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        return profile;
    } catch (error) {
        console.error('Failed to get profile:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Check kiểu số
const isNotNumber = (val) => typeof val !== 'number' || Number.isNaN(val);

// Check ngày tháng
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

// Validate thay đổi của ít nhất 1 trường
const validateChanges = (body) => {
    const entries = Object.entries(body);
    if (entries.length === 0) {
        return 'ít nhất một trường hợp lệ là bắt buộc';
    }

    if (entries.some(([field]) => !SAVING_FIELD.has(field))) {
        return 'Request body chứa các trường không hợp lệ';
    }

    for (const [key, value] of entries) {
        if(key === "name" && (!value))
            return "Vui lòng nhập tên mục tiêu tiết kiệm";

        // Phải để undefined thì mới so sánh được số
        if(key === "target_amount" &&
            (isNotNumber(value) || value <= 0))
            return "Mục tiêu đạt được phải là 1 số thập phân dương, tối đa 2 chữ số sau dấu phảy";

        if(key === "monthly_contribution" &&
            (isNotNumber(value) || (value <= 0)))
            return "Đóng góp hàng tháng phải là 1 số thập phân dương, tối đa 2 chữ số sau dấu phảy";

        if(key === "interest_rate" &&
            (isNotNumber(value) || (value < 0)))
            return "Lãi suất hàng tháng phải là 1 số không âm";

        if(key === "target_date" && (!isValidDate(value) || new Date(value) <= new Date()))
        {
            return "Thời gian hoàn thành mục tiêu không hợp lệ, phải lớn hơn ngày hiện tại"
        }
    }

    return null;
}


// Lấy danh sách mục tiêu
export const getSaving = async (req, res) => {
    const user = await getUser(req, res);
    const user_id = user.id;
    const { saving_id, page, month, year } = req.query;
    try {
        const savings = isValidId(saving_id) ? await SavingModel.readById(user_id, saving_id)
                                             : await SavingModel.readAll(user_id, page, month, year);
        if(savings || savings.length > 0)
        {
            return res.status(200).json({
                status: "success",
                data: savings
            });
        }
        return res.status(400).json({
            status: "false",
            message: "Không tìm thấy dữ liệu!"
        });
    } catch (error) {
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });   
    }
};


// Thêm mục tiêu tiết kiệm mới
export const addNewSaving = async (req, res) => {
    const user = await getUser(req, res);
    const user_id = user.id;

    const { name, target_amount, monthly_contribution, target_date, interest_rate } = req.body;

    const body = {
        target_amount: target_amount,
        name: name,
        monthly_contribution: monthly_contribution,
        target_date: target_date,
        interest_rate: interest_rate
    };

    const validationError = validateChanges(body);
    if (validationError) {
        return res.status(400).json({ status: "false", message: validationError });
    };

    if(isNotNumber(monthly_contribution) || (monthly_contribution > target_amount))
    {
        return res.status(400).json({
            status: "false",
            message: "Đóng góp hàng tháng không được lớn hơn mục tiêu đề ra"
        })
    }

    try {
        const id = await SavingModel.create(user_id, name, target_amount, monthly_contribution, target_date, interest_rate);
        if (id) {
            return res.status(200).json({
                status: "success",
                message: "Đã thêm mục tiêu tiết kiệm thành công"
            })
        }
        return res.status(400).json({
            status: "false",
            message: "Thêm mục tiêu tiết kiệm thất bại"
        })
    } catch (error) {
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
};

// Sưa mục tiêu tiết kiệm
export const editSaving = async (req, res) => {
    const user = await getUser(req, res);
    const user_id = user.id;

    // Để cái này trước vì chạy lệnh delete nó xóa luôn trường saving_id
    const { saving_id } = req.body;

    if(!isValidId(saving_id))
    {
        return res.status(400).json({
            status: "false",
            message: "Id tài sản không hợp lệ"
        })
    }

    const body = req.body;
    delete body.saving_id;

    const validationError = validateChanges(body);
    if (validationError) {
        return res.status(400).json({ status: "false", message: validationError });
    };

    const saving = await SavingModel.readById(saving_id, user_id);
    if(!saving)
    {
        return res.status(400).json({
            status: "false",
            message: "Tài sản không tồn tại"
        })
    }

    // Các bước validate phụ
    const { monthly_contribution, current_amount, target_date, status } = req.body;

    if(monthly_contribution && (isNotNumber(monthly_contribution) || (monthly_contribution > saving.target_amount)))
    {
        return res.status(400).json({
            status: "false",
            message: "Đóng góp hàng tháng không được lớn hơn mục tiêu đề ra"
        })
    }

    if(current_amount && (isNotNumber(current_amount) || (current_amount > saving.target_amount)))
    {
        return res.status(400).json({
            status: "false",
            message: "Tiến độ hiện tại phải là 1 số thập phân dương, tối đa 2 chữ số sau dấu phảy và không được lớn hơn mục tiêu đề ra"
        })
    }

    if(status && !STATUS.has(status))
    {
        return res.status(400).json({
            status: "false",
            message: "Trạng thái mục tiêu không hợp lệ, phải là ACTIVE, COMPLETED, CANCELLED"
        })
    }
    

    try {
        
        const affected = await SavingModel.update(saving_id, user_id, body);
        if(affected)
        {
            return res.status(200).json({
                status: "success",
                message: "Đã sửa mục tiêu tiết kiệm thành công"
            })
        }
        return res.status(400).json({
            status: "false",
            message: "Sửa mục tiêu tiết kiệm thất bại"
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
}


// Xóa mục tiêu tiết kiệm
export const deleteSaving = async (req, res) => {
    const user = await getUser(req, res);
    const user_id = user.id;

    const { saving_id } = req.body;

    if(!isValidId(saving_id))
    {
        return res.status(400).json({
            status: "false",
            message: "Id mục tiêu tiết kiệm không hợp lệ"
        })
    }

    try {
        const affected = await SavingModel.delete(saving_id, user_id);
        if(affected)
        {
            return res.status(200).json({
                status: "success",
                message: "Đã xóa mục tiêu tiết kiệm thành công"
            })
        }
        return res.status(400).json({
            status: "false",
            message: "Xóa mục tiêu tiết kiệm thất bại"
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
}