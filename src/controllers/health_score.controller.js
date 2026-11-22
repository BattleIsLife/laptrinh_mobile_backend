import UserModel from "../models/user.model.js";
import CreditScoreModel from "../models/health_score.model.js";

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

export const calculateHealthScore = async (req, res) => {
    const user = await getUser(req, res);
    const { month, year } = req.query;
    const monthly_income = user.monthly_income;

    const monthNum = Number(month);
    const yearNum = Number(year);

    if((monthNum > 13 || monthNum < 1))
    {
        return res.status(400).json({
            status: "false",
            message: "Tháng không hợp lệ"
        })
    }

    if((yearNum > 9999 || yearNum < 1000))
    {
        return res.status(400).json({
            status: "false",
            message: "Năm không hợp lệ"
        })
    }

    if(monthly_income <= 0)
    {
        return res.status(400).json({
            status: "false",
            message: "Bạn chưa khai báo thu nhập cá nhân!!"
        })
    }

    try {
        const dti = await calculateDTI(user.id, monthly_income, month, year);
        return res.status(200).json({
            status: "success",
            dti: dti,
            message: "Đã tính toán điểm tài chính thành công!!"
        });
    } catch (error) {
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });   
    }
}

// Tính toán DTI (chỉ trả về số và thông báo)
const calculateDTI = async (user_id, monthly_income, month, year) => {
    const monthly_payment = await CreditScoreModel.getSumMonthlyPayment(user_id, month, year);
    const dti = monthly_payment / monthly_income * 100;
    return {
        result: dti,
        message: dtiMessage(dti)
    };
}

// Tính toán savingRate
const calculateSR = async (user_id, month, year) => {
    
}


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

const savingRateMessage = (sr) => {

}