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

    try {
        const dti = await calculateDTI(user.id, monthly_income);
        const saving_rate = await calculateSR(user.id, month, year);
        const emergency_fund_months = await calculateEmergencyFundMonths(user.id, month, year);
        const cashflow_recent = await calculateRecentCashflow(user.id, month, year);
        const health_score = (dti.result !== null && saving_rate.result !== null && 
                              cashflow_recent.result !== null && emergency_fund_months.result !== null) 
                            ? getPointDTI(dti.result)*0.3 + getPointSavingRate(saving_rate.result)*0.25 + getPointCashflow(cashflow_recent.result)*0.25 + getPointEmergencyFundMonths(emergency_fund_months.result) * 0.2 
                            : null;

        return res.status(200).json({
            status: "success",
            dti: dti,
            saving_rate: saving_rate,
            emergency_fund_months: emergency_fund_months,
            cashflow_recent: cashflow_recent,
            health_score: health_score,
            message: health_score !== null ? "Đã tính toán điểm sức khỏe tài chính thành công" : "Thiếu dữ liệu tính toán"
        });
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });   
    }
}

// Tính toán DTI (chỉ trả về số và thông báo)
const calculateDTI = async (user_id, monthly_income) => {
    const monthly_payment = await HealthScoreModel.getSumMonthlyPayment(user_id);
    const dti = monthly_income > 0 ? monthly_payment / monthly_income * 100 : null;
    return {
        result: dti,
        message: dtiMessage(dti)
    };
}

// Tính toán savingRate
const calculateSR = async (user_id, month, year) => {
    const sum_income = await HealthScoreModel.getSumIncome(user_id, month, year);
    const sum_expense = await HealthScoreModel.getSumExpense(user_id, month, year);
    let saving_rate = null;
    
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
    const sum_saving = await HealthScoreModel.getSumSaving(user_id);
    const sum_essential_expense = await HealthScoreModel.getSumEssentialExpense(user_id, month, year);
    let emergency_fund_months = null;
    if(sum_essential_expense > 0 && sum_saving > 0)
    {
        emergency_fund_months = sum_saving / sum_essential_expense;
    }
    return {
        result: emergency_fund_months,
        message: getPointEmergencyFundMonthsMessage(emergency_fund_months)
    };
}


// Tính toán cashflow
const calculateRecentCashflow = async (user_id, month, year) => {
    let cashflow = [];
    // 3 tháng gần nhất!!
    for(let i = 0; i < 3; i++)
    {
        const sum_expense = await HealthScoreModel.getSumExpense(user_id, month, year);
        const sum_income = await HealthScoreModel.getSumIncome(user_id, month, year);
        if(sum_expense == 0 || sum_income == 0)
            cashflow.push(null);
        else
        {
            const cashflow_value = sum_income - sum_expense;
            cashflow.push(cashflow_value);
        }
        month--;
        if(month < 1)
        {
            month = 12;
            year--;
        }
    }
    return {
        result: cashflow,
        message: getCashflowMessage(cashflow)
    };
}

const getPointDTI = (dti) => {
    if(dti == null)
        return null;
    if(dti == 0)
        return 100;
    if(dti <= 20)
        return 90;
    if(dti <= 35)
        return 70;
    if(dti <= 50)
        return 40;
    return 10;
}

const getPointSavingRate = (sr) => {
    if(sr == null)
        return null;
    if(sr > 35)
        return 100;
    if(sr >= 20)
        return 85;
    if(sr >= 10)
        return 60;
    if(sr > 0)
        return 30;
    return 0;
}

const getPointEmergencyFundMonths = (emergency_fund_months) => {
    if(emergency_fund_months == null)
        return null;
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
        if(element === null)
            return null;
        if(element > 0)
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
    if(dti == null)
    {
        return "Hệ thống chưa đủ dữ liệu thu nhập hoặc nghĩa vụ trả nợ để đánh giá DTI. Vui lòng cập nhật thông tin tài chính."
    }
    if(dti == 0)
    {
        return "Bạn hiện không có nghĩa vụ thanh toán nợ hàng tháng được ghi nhận. Hãy tiếp tục duy trì khả năng quản lý tài chính hiện tại.";;
    }

    if(dti <= 20)
    {
        return "Tỷ lệ nghĩa vụ nợ so với thu nhập đang ở mức tốt. Tiếp tục duy trì kế hoạch thanh toán và hạn chế phát sinh khoản nợ không cần thiết.";
    }

    if(dti <= 35)
    {
        return "Nghĩa vụ thanh toán nợ đang chiếm một phần đáng kể trong thu nhập. Hãy theo dõi các khoản nợ và cân đối ngân sách hàng tháng.";
    }

    if(dti <= 50)
    {
        return "Áp lực trả nợ đang tương đối lớn. Hãy rà soát các khoản nợ, ưu tiên những khoản có chi phí lãi vay cao và hạn chế vay thêm."
    }

    return "Phần lớn thu nhập đang được sử dụng cho nghĩa vụ trả nợ. Hãy lập kế hoạch giảm áp lực nợ, xem xét điều chỉnh chi tiêu và tránh phát sinh thêm nghĩa vụ tài chính.";
}

const savingRateMessage = (sr) => {
    if(sr == null)
        return "Hệ thống chưa có đủ dữ liệu thu nhập hoặc chi tiêu để xác định tỷ lệ tiết kiệm."
    if(sr > 35)
    {
        return "Khả năng tiết kiệm hiện tại rất tốt. Hãy tiếp tục duy trì ngân sách và phân bổ khoản tiết kiệm phù hợp với các mục tiêu tài chính.";
    }
    if (sr >= 20)
    {
        return "Bạn đang duy trì tỷ lệ tiết kiệm tốt. Tiếp tục theo dõi thu nhập và chi tiêu để giữ mức tiết kiệm ổn định.";
    }

    if (sr >= 10)
    {
        return "Tỷ lệ tiết kiệm ở mức khá nhưng vẫn có thể cải thiện. Hãy rà soát các khoản chi tiêu và đặt mục tiêu tiết kiệm hàng tháng.";
    }

    if (sr >= 0)
    {
        return "Phần thu nhập còn lại sau chi tiêu tương đối thấp. Hãy xác định các khoản chi không thiết yếu và cân nhắc điều chỉnh ngân sách.";
    }

    return "Chi tiêu đang bằng hoặc vượt thu nhập. Hãy rà soát các khoản chi, xác định nguyên nhân thâm hụt và xây dựng kế hoạch cân đối tài chính.";
}

const getCashflowMessage = (cashflow) => {
    let times = 0
    for (let index = 0; index < cashflow.length; index++) {
        const element = cashflow[index];
        if(element === null)
        {
            times = -1;
            break;
        }
        if(element > 0)
            times++;
    }
        
    switch (times) {
        case -1:
            return "Hệ thống chưa có đủ dữ liệu thu nhập và chi tiêu trong 3 tháng gần nhất để đánh giá tính ổn định của dòng tiền.";
        case 3:
            return "Dòng tiền của bạn đang duy trì ổn định trong 3 tháng gần nhất. Hãy tiếp tục theo dõi thu nhập và chi tiêu để duy trì trạng thái này."
        case 2:
            return "Dòng tiền nhìn chung khá ổn định nhưng vẫn có tháng phát sinh thâm hụt. Hãy xác định nguyên nhân và điều chỉnh kế hoạch chi tiêu."
        case 1:
            return "Dòng tiền chưa ổn định, chỉ có một tháng ghi nhận thặng dư. Hãy rà soát những tháng thâm hụt và xây dựng ngân sách phù hợp hơn."
    
        default:
            return "Thu nhập chưa đủ bù đắp chi tiêu trong cả 3 tháng gần nhất. Hãy ưu tiên cân đối ngân sách, xem xét các khoản chi thiết yếu và tìm cách cải thiện nguồn thu nếu phù hợp.";
    }
}

const getPointEmergencyFundMonthsMessage = (months) => {
    if(months >= null)
        return "Hệ thống chưa có đủ dữ liệu về số tiền tiết kiệm dành cho quỹ khẩn cấp hoặc chi phí thiết yếu hàng tháng."
    if(months >= 6)
        return "Quỹ dự phòng hiện tại có khả năng đáp ứng chi phí thiết yếu trong ít nhất 6 tháng. Hãy tiếp tục duy trì và bảo toàn khoản dự phòng này."
    if(months >= 3)
        return "Quỹ dự phòng đang ở mức tương đối an toàn. Hãy tiếp tục tích lũy để nâng cao khả năng ứng phó với các tình huống bất ngờ."
    if(months > 0)
        return "Quỹ dự phòng còn thấp so với chi phí thiết yếu. Hãy ưu tiên dành một phần thu nhập phù hợp để xây dựng khoản dự phòng."
    if(months == 0)
        return "Bạn chưa có khoản dự phòng được ghi nhận. Hãy bắt đầu xây dựng quỹ khẩn cấp bằng những khoản tích lũy nhỏ, phù hợp với khả năng tài chính."
    if(months >= 6)
        return "Quỹ dự phòng hiện tại có khả năng đáp ứng chi phí thiết yếu trong ít nhất 6 tháng. Hãy tiếp tục duy trì và bảo toàn khoản dự phòng này."
}