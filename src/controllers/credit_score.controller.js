import UserModel from "../models/user.model.js";
import CreditScoreModel from "../models/credit_score.model.js";

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

const isNotNumber = (val) => typeof val !== 'number' || Number.isNaN(val);

const dtiMessage = (dti) => {
    if(dti <= 30)
    {
        return "DTI của bạn an toàn, hãy cố gắng duy trì!!";;
    }

    if(dti <= 50)
    {
        return "DTI của bạn đang ở mức trung bình, hãy chú ý!!";
    }

    return "DTI của bạn đang ở ngưỡng nguy hiểm";
}


// Tính toán DTI (chỉ trả về số)
export const calculateDTI = async (req, res) => {
    const user = getUser(req, res);
    const { monthly_income } = user;
    const { month, year } = req.body;

    if(monthly_income === 0)
    {
        return res.status(400).json({
            status: "false",
            message: "Bạn chưa khai báo thu nhập cá nhân!!"
        })
    }

    if(isNotNumber(month) || (month > 13 || month < 1))
    {
        return res.status(400).json({
            status: "false",
            message: "Tháng không hợp lệ"
        })
    }

    if(isNotNumber(year) || (month > 9999 || month < 1000))
    {
        return res.status(400).json({
            status: "false",
            message: "Năm không hợp lệ"
        })
    }

    try {
        const monthly_payment = await CreditScoreModel.getSumMonthlyPayment(user_id, month, year);
        const dti = monthly_payment / monthly_income * 100;
        return dti;
    } catch (error) {
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
}

export const returnDTIMessage = async (req, res) => {
    dti = await calculateDTI(req, res);
    return res.status(400).json({
        status: "success",
        message: dtiMessage(dti),
        dti: dti
    });
}