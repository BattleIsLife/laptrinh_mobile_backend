import CreditAccountModel from "../models/credit_account.model.js";
import UserModel from "../models/user.model.js";

const ACCOUNT_FIELDS = new Set([
    'account_type',
    'bank_name',
    'credit_limit',
    'current_balance',
    'opened_date'
]);

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

// Validate thay đổi của ít nhất 1 trường
const validateChanges = (body) => {
    const entries = Object.entries(body);
    if (entries.length === 0) {
        return 'ít nhất một trường hợp lệ là bắt buộc';
    }

    if (entries.some(([field]) => !ACCOUNT_FIELDS.has(field))) {
        return 'Request body chứa các trường không hợp lệ';
    }

    for (const [key, value] of entries) {
        if(key === "account_type" &&
            (!value || (value !== "CREDIT_CARD" && value !== "OVERDRAFT")))
            return "Loại tài khoản không hợp lệ, phải là CREDIT_CARD hoặc OVERDRAFT";

        if(key === "bank_name" && (!value))
            return "Vui lòng nhập tên ngân hàng";

        // Phải để undefined thì mới so sánh được số
        if(key === "credit_limit" &&
            (isNotNumber(value) || value < 0))
            return "Hạn mức tín dụng phải là 1 số thập phân không âm, tối đa 2 chữ số sau dấu phảy";

        if(key === "current_balance" &&
            (isNotNumber(value) || value < 0))
            return "Số dư tài khoản phải là 1 số thập phân không âm, tối đa 2 chữ số sau dấu phảy";
    }

    return null;
}


// Trả về tất cả hoặc 1 thẻ tín dụng của user
export const getCreditAccount = async (req, res) => {
    const user = await getUser(req, res);
    const { account_id } = req.query;
    try {
        const account = account_id ? await CreditAccountModel.getAccountByIdAndUser(account_id, user.id) 
                                   : await CreditAccountModel.getAccountsByUser(user.id);
        if(!account)
        {
            return res.status(400).json({
                status: "false", 
                message: "Không tìm thấy tài khoản"}
            );
        }

        return res.status(200).json({
            status: "true",
            data: account
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
};


// Mở thẻ tín dụng
export const openCreditAccount = async (req, res) => {
    const user = await getUser(req, res);
    const { account_type, bank_name, credit_limit, current_balance, opened_date } = req.body;

    if(!account_type || (account_type !== "CREDIT_CARD" && account_type !== "OVERDRAFT"))
        return res.status(400).json({
            status: "false", 
            message: "Loại tài khoản không hợp lệ, phải là CREDIT_CARD hoặc OVERDRAFT"}
        );
    if(!bank_name)
        return res.status(400).json({
            status: "false", 
            message: "Vui lòng nhập tên ngân hàng"}
        );
    if(!credit_limit || typeof credit_limit !== 'number'
                || credit_limit < 0)
        return res.status(400).json({
            status: "false", 
            message: "Hạn mức tín dụng phải là 1 số thập phân không âm, tối đa 2 chữ số sau dấu phảy"}
        );
    if(!current_balance || typeof current_balance !== 'number'
                || current_balance < 0)
        return res.status(400).json({
            status: "false", 
            message: "Số dư tài khoản phải là 1 số thập phân không âm, tối đa 2 chữ số sau dấu phảy"}
        );
    let new_opened_date = opened_date ?? new Date();
    
    try {
        await CreditAccountModel.create(user.id, account_type, bank_name, credit_limit, current_balance, new_opened_date);
        return res.status(200).json({
            status: "success",
            message: "Đã thêm tài khoản tín dụng thành công"
        })
    } catch (error) {
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
}


// Cập nhật thông tin của 1 thẻ tín dụng
export const updateCreditAccount = async (req, res) => {
    const user = await getUser(req, res);
    const { account_id, account_type, bank_name, credit_limit, current_balance } = req.body;
    const body = req.body;
    delete body.account_id;
    const validationError = validateChanges(body);
    if (validationError) {
        return res.status(400).json({ status: "false", message: validationError });
    }

    try {
        const updated = await CreditAccountModel.update(account_id, user.id, body);
        if(!updated || updated === 0)
            return res.status(400).json({ status: "false", message: "Không tìm thấy tài khoản" });
        return res.status(200).json({
            status: "success",
            message: "Đã cập nhật tài khoản tín dụng thành công"
        })
    } catch (error) {
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
};