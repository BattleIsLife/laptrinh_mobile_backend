import UserModel from "../models/user.model.js";
import HealthScoreModel from "../models/health_score.model.js";

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
        const saving_rate = await calculateSR(user.id, month, year);
        const emergency_fund_months = await calculateEmergencyFundMonths(user.id, month, year);
        const cashflow_recent = await calculateRecentCashflow(user.id, month, year);
        const health_score = getPointDTI(dti.result)*0.3 + getPointSavingRate(saving_rate.result)*0.25 + getPointCashflow(cashflow_recent)*0.25 + getPointEmergencyFundMonths(emergency_fund_months) * 0.2;
        return res.status(200).json({
            status: "success",
            dti: dti,
            saving_rate: saving_rate,
            emergency_fund_months: emergency_fund_months,
            health_score: health_score,
            cashflow_recent: cashflow_recent,
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
    const monthly_payment = await HealthScoreModel.getSumMonthlyPayment(user_id, month, year);
    const dti = monthly_payment / monthly_income * 100;
    return {
        result: dti,
        message: dtiMessage(dti)
    };
}

// Tính toán savingRate
const calculateSR = async (user_id, month, year) => {
    const sum_income = await HealthScoreModel.getSumIncome(user_id, month, year);
    const sum_expense = await HealthScoreModel.getSumExpense(user_id, month, year);
    let saving_rate = 100;
    
    if(sum_income !== 0)
    {
        saving_rate = (sum_income - sum_expense) / sum_income;
    }
    return {
        result: saving_rate,
        message: savingRateMessage(saving_rate)
    };
}


// Tính toán số tháng quỹ khẩn cấp
const calculateEmergencyFundMonths = async (user_id, month, year) => {
    const sum_saving = await HealthScoreModel.getSumSaving(user_id, month, year);
    const sum_asset = await HealthScoreModel.getSumMoneyAssets(user_id, month, year);
    const sum_essential_expense = await HealthScoreModel.getSumEssentialExpense(user_id, month, year);
    let emergencyFundMonths = 0;
    if(sum_essential_expense > 0)
    {
        emergencyFundMonths = (sum_asset + sum_saving) / emergencyFundMonths;
    }
    return emergencyFundMonths;
}


// Tính toán cashflow
const calculateRecentCashflow = async (user_id, month, year) => {
    let cashflow = [];
    // 3 tháng gần nhất!!
    for(let i = 0; i < 3; i++)
    {
        const sum_expense = await HealthScoreModel.getSumExpense(user_id, month, year);
        const sum_income = await HealthScoreModel.getSumIncome(user_id, month, year);
        const cashflow_value = sum_income - sum_expense;
        cashflow.push(cashflow_value);
        month--;
        if(month < 1)
        {
            month = 12;
            year--;
        }
    }
    return cashflow;
}

const getPointDTI = (dti) => {
    if(dti == 0)
        return 100;
    if(dti < 20)
        return 90;
    if(dti < 35)
        return 40;
    return 10;
}

const getPointSavingRate = (sr) => {
    if(sr > 35)
        return 100;
    if(sr > 20)
        return 85;
    if(sr > 10)
        return 50;
    return 0
}

const getPointEmergencyFundMonths = (emergency_fund_months) => {
    if(emergency_fund_months >= 6)
        return 100;
    if(emergency_fund_months >= 3)
        return 85;
    if(emergency_fund_months >= 1)
        return 50;
    if(emergency_fund_months > 0)
        return 20;
    return 0
}

const getPointCashflow = (cashflow_value) => {
    let positive = 0;
    cashflow_value.forEach(element => {
        if(element >= 0)
            positive++;
    });
    switch (positive) {
        case 3:
            return 100;
        case 2:
            return 70;
        case 1:
            return 40;
        default:
            return 0;
    }
};

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
    if(sr >= 20)
    {
        return "Bạn đang chi tiêu lành mạnh, cứ thế phát huy!!";
    }
    if (sr >= 0)
    {
        return "Hãy chú ý chi tiêu của bạn nhiều hơn!!";
    }
    return "Chi tiêu của bạn đang ở mức nguy hiểm!!";
}