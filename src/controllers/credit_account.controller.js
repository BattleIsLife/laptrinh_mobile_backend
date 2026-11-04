import CreditAccountModel from "../models/credit_account.model.js";
import UserModel from "../models/user.model.js";

const isValidUserId = (id) => {
    const userId = String(id);
    if (!/^[1-9]\d*$/.test(userId)) {
        return false;
    }
    return BigInt(id) <= 18446744073709551615n;
};

const getUser = async (req, res) => {
    const user_id = req.user?.id
    if (!isValidUserId(user_id)) {
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

// 'account_type',
// 'bank_name',
// 'credit_limit',
// 'current_balance',
// 'opened_date'

// Mở thẻ tín dụng
export const openCreditAccount = async (req, res) => {
    const user = await getUser(req, res);
    try {
        const { account_type, bank_name, credit_limit, current_balance, opened_date } = req.body

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
        if(!current_balance || typeof credit_limit !== 'number'
                    || current_balance < 0)
            return res.status(400).json({
                                            status: "false", 
                                            message: "Số dư tài khoản phải là 1 số thập phân không âm, tối đa 2 chữ số sau dấu phảy"}
                                        );
        let new_opened_date = opened_date ?? new Date();
        
        await CreditAccountModel.create(user.id, account_type, bank_name, credit_limit, current_balance, new_opened_date);
        return res.status(200).json({
            status: "success",
            message: "Đã thêm tài khoản tín dụng thành công"
        })
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        })   
    }
}