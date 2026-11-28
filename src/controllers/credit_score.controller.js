import CreditScoreModel from "../models/credit_score.model.js";
import UserModel from "../models/user.model.js"

const isValidId = (id) => {
    const parsedId = String(id);
    if (!/^[1-9]\d*$/.test(parsedId)) {
        return false;
    }
    return BigInt(id) <= 18446744073709551615n;
};
export const calculateCreditScore = async (req, res) => {
    try {

        // Kiểm tra người dùng có tồn tại (giả sử token còn hạn nhưng user bị xóa vì một lý do nào đó idk)
        const user_id = parseInt(req.user.id);
        const profile = await UserModel.getProfile(user_id);
        if (!profile) {
            return res.status(404).json({
                status: "false",
                message: 'Người dùng không tồn tại'
            });
        }
        const calculate_data = {};
        let hasNullScore = false;
        const required_data = {}
        // Tính lịch sử thanh toán nợ
        const count_paid_debt_payment = await CreditScoreModel.countPaidDebtPayment(user_id);
        const count_not_pending_debt_payment = await CreditScoreModel.countNotPendingDebtPayment(user_id);
        let debt_payment_rate;
        let debt_payment_score;
        if (count_not_pending_debt_payment > 0) {
            debt_payment_rate = Number(((count_paid_debt_payment / count_not_pending_debt_payment) * 100).toFixed(2));
            debt_payment_score = convertDebtScore(debt_payment_rate).score;
        } else {
            hasNullScore = true;
            required_data.debt_payment = "Hệ thống chưa có đủ dữ liệu để đánh giá lịch sử thanh toán.";
        }
        // Tính tỷ lệ dùng hạn mức
        const sum_current_balance = await CreditScoreModel.getSumCurrentBalance(user_id);
        const sum_credit_limit = await CreditScoreModel.getSumCreditLimit(user_id);
        let utilization_rate;
        let utilization_score;
        if (sum_credit_limit > 0) {
            utilization_rate = Number(((sum_current_balance / sum_credit_limit) * 100).toFixed(2));
            utilization_score = convertUtilizationScore(utilization_rate).score;
        } else {
            hasNullScore = true;
            required_data.utilization = "Hệ thống chưa có đủ dữ liệu để đánh giá tỷ lệ sử dụng tín dụng.";
        }
        // Tính thâm niên tín dụng
        const oldest_credit_account_opened_date = await CreditScoreModel.getOldestCreditAccount(user_id)
        let age;
        let age_score;
        if (oldest_credit_account_opened_date != null) {
            const now = Date.now();
            const oldest = new Date(oldest_credit_account_opened_date).getTime();
            const diffMs = Math.abs(now - oldest);
            const msPerYear = 1000 * 60 * 60 * 24 * 365.25; // tính cả năm nhuận
            age = Number((diffMs / msPerYear).toFixed(2));
            age_score = convertAgeScore(age).score;
        } else {
            hasNullScore = true;
            required_data.age = "Hệ thống chưa có đủ dữ liệu để đánh giá thâm niên tín dụng.";
        }
        // Tính cơ cấu tín dụng
        const count_debt_mix = await CreditScoreModel.getDebtMix(user_id);
        const count_credit_account_mix = await CreditScoreModel.getCreditAccountMix(user_id);
        const mix_score = convertMixScore(count_debt_mix + count_credit_account_mix).score;

        // Tính yêu cầu tín dụng mới (trong 12 tháng, quy ra 365 ngày)
        const count_new_application = await CreditScoreModel.countNewApplication(user_id);
        const new_application_score = convertNewApplicationScore(count_new_application).score;

        // Ghi lại toàn bộ các chỉ số tính toán, dùng khi debug
        calculate_data.count_paid_debt_payment = count_paid_debt_payment;
        calculate_data.count_not_pending_debt_payment = count_not_pending_debt_payment;
        calculate_data.debt_payment_rate = debt_payment_rate;
        calculate_data.debt_payment_score = convertDebtScore(debt_payment_rate);
        calculate_data.sum_current_balance = sum_current_balance;
        calculate_data.sum_credit_limit = sum_credit_limit;
        calculate_data.utilization_rate = utilization_rate;
        calculate_data.utilization_score = convertUtilizationScore(utilization_rate);
        calculate_data.oldest_credit_account_opened_date = oldest_credit_account_opened_date;
        calculate_data.age = age;
        calculate_data.age_score = convertAgeScore(age);
        calculate_data.count_debt_mix = count_debt_mix;
        calculate_data.count_credit_account_mix = count_credit_account_mix;
        calculate_data.mix_score = convertMixScore(count_debt_mix + count_credit_account_mix);
        calculate_data.count_new_application = count_new_application;
        calculate_data.new_application_score = convertNewApplicationScore(count_new_application);

        // Tính điểm cuối cùng
        if (!hasNullScore) {
            const final_score = Math.round(300 + 550 * ((0.35 * debt_payment_score + 0.3 * utilization_score + 0.15 * age_score + 0.1 * mix_score + 0.1 * new_application_score)) / 100);
            // console.log(final_score);
            // console.log(getCreditScoreTier(final_score));
            const credit_score_data = {
                user_id: user_id,
                score: final_score,
                score_tier: getCreditScoreTier(final_score),
                score_breakdown: {
                    payment: { label: "Lịch sử thanh toán", result: debt_payment_rate },
                    utilization: { label: "Mức sử dụng tín dụng", result: utilization_rate },
                    age: { label: "Độ dài lịch sử tín dụng", result: age },
                    mix: { label: "Đa dạng tín dụng", result: count_debt_mix + count_credit_account_mix },
                    new: { label: "Tín dụng mới (trong 12 tháng)", result: count_new_application },
                }
            }
            const insertId = await CreditScoreModel.saveCreditScore(credit_score_data);
            if (insertId) {
                // Lưu các khuyến nghị vào CSDL (cần xem xét lại các type trong recommendations)
                
                return res.status(201).send({
                    status: "success",
                    message: "Tính điểm tín dụng thành công",
                    data: credit_score_data
                });
            }
        } else {
            return res.status(409).send({
                status: "false",
                message: "Dữ liệu tài chính chưa đầy đủ để tính, hãy bổ sung theo yêu cầu",
                required_data: required_data
            });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const getCreditScore = async (req, res) => {
    try {

        return res.status(200).send({
            status: "success",
            message: "Lấy kết quả điểm tín dụng thành công",
            data: {}
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const getCreditScoreHistory = async (req, res) => {
    try {

        return res.status(200).send({
            status: "success",
            message: "Lấy lịch sử điểm tín dụng thành công",
            data: {}
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const getCreditScoreRecommendation = async (req, res) => {
    try {

        return res.status(200).send({
            status: "success",
            message: "Lấy khuyến nghị điểm tín dụng thành công",
            data: {}
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

function getCreditScoreTier(score) {
    if (score >= 800) {
        return "EXCELLENT";
    } else if (score >= 740) {
        return "VERY_GOOD";
    } else if (score >= 670) {
        return "GOOD";
    } else if (score >= 580) {
        return "FAIR";
    } else if (score >= 300) {
        return "POOR";
    }
}

function convertDebtScore(debt_payment) {
    if (debt_payment < 50) {  // P < 50
        return {
            score: 10,
            recommendation: "Rà soát lịch thanh toán và thiết lập nhắc nhở trước ngày đến hạn.",
            priority: "HIGH"
        };
    } else if (debt_payment < 70) { // 50 <= P < 70
        return {
            score: 30,
            recommendation: "Ưu tiên cải thiện việc thanh toán đúng hạn và kiểm tra các nghĩa vụ nợ còn tồn đọng.",
            priority: "HIGH"
        };
    } else if (debt_payment < 85) { // 70 <= P < 85
        return {
            score: 50,
            recommendation: "Theo dõi sát các kỳ thanh toán và hạn chế phát sinh thêm kỳ trả chậm.",
            priority: "MEDIUM"
        };
    } else if (debt_payment < 95) { // 85 <= P < 95
        return {
            score: 75,
            recommendation: "Duy trì kế hoạch thanh toán ổn định để cải thiện lịch sử tín dụng.",
            priority: "MEDIUM"
        };
    } else if (debt_payment < 100) { // 95 <= P < 100
        return {
            score: 90,
            recommendation: "Tiếp tục duy trì việc thanh toán đúng hạn, chú ý những kỳ từng bị trễ.",
            priority: "LOW"
        };
    } else if (debt_payment == 100) { // P = 100
        return {
            score: 100,
            recommendation: "Tiếp tục duy trì thói quen thanh toán đúng hạn để giữ điểm số cao.",
            priority: "LOW"
        };
    }
    return {
        score: null,
        recommendation: "Hệ thống chưa có đủ dữ liệu để đánh giá lịch sử thanh toán.",
        priority: "LOW"
    };
}
function convertUtilizationScore(utilization) {
    if (utilization > 90) { // U > 90
        return {
            score: 10,
            recommendation: "Ưu tiên kiểm soát dư nợ tín dụng và hạn chế phát sinh thêm chi tiêu không cần thiết.",
            priority: "HIGH"
        };
    } else if (utilization > 70) { // 70 < U <= 90 
        return {
            score: 30,
            recommendation: "Rà soát các khoản chi tiêu bằng tín dụng và cân nhắc giảm dư nợ hiện tại.",
            priority: "HIGH"
        };
    } else if (utilization > 50) { // 50 < U <= 70 
        return {
            score: 50,
            recommendation: "Điều chỉnh ngân sách và có kế hoạch giảm dần mức sử dụng hạn mức.",
            priority: "MEDIUM"
        };
    } else if (utilization > 30) { // 30 < U <= 50 
        return {
            score: 75,
            recommendation: "Theo dõi dư nợ và hạn chế sử dụng thêm hạn mức nếu không cần thiết.",
            priority: "MEDIUM"
        };
    } else if (utilization > 10) { // 10 < U <= 30 
        return {
            score: 90,
            recommendation: "Duy trì mức sử dụng tín dụng hợp lý và theo dõi dư nợ định kỳ.",
            priority: "LOW"
        };
    } else if (utilization <= 10) { // U <= 10
        return {
            score: 100,
            recommendation: "Tiếp tục duy trì mức sử dụng hạn mức hiện tại để giữ mức điểm cao.",
            priority: "LOW"
        };
    }
    return {
        score: null,
        recommendation: "Hệ thống chưa có đủ dữ liệu để đánh giá tỷ lệ sử dụng tín dụng.",
        priority: "LOW"
    };
}
function convertAgeScore(age) {
    if (age <= 1) {
        return {
            score: 50,
            recommendation: "Lịch sử tín dụng còn ngắn. Hãy duy trì các tài khoản hiện có một cách có trách nhiệm và thanh toán đúng hạn.",
            priority: "LOW"
        };
    } else if (age <= 3) {
        return {
            score: 60,
            recommendation: "Tiếp tục xây dựng lịch sử tín dụng ổn định và tránh phát sinh các tài khoản không cần thiết.",
            priority: "LOW"
        };
    } else if (age <= 5) {
        return {
            score: 75,
            recommendation: "Duy trì các tài khoản hiện tại và theo dõi lịch sử thanh toán thường xuyên.",
            priority: "LOW"
        };
    } else if (age <= 7) {
        return {
            score: 90,
            recommendation: "Tiếp tục duy trì lịch sử tín dụng ổn định.",
            priority: "LOW"
        };
    } else if (age > 7) {
        return {
            score: 100,
            recommendation: "Lịch sử tín dụng đã được duy trì trong thời gian dài. Tiếp tục quản lý các tài khoản hiện có hợp lý.",
            priority: "LOW"
        };
    }
    return {
        score: null,
        recommendation: "Hệ thống chưa có đủ dữ liệu để đánh giá thâm niên tín dụng.",
        priority: "LOW"
    };
}
function convertMixScore(mix) {
    if (mix == 0) {
        return {
            score: 50,
            recommendation: "Chưa có dữ liệu về cơ cấu tín dụng. Không cần mở khoản vay để cải thiện tiêu chí này.",
            priority: "LOW"
        };
    } else if (mix == 1) {
        return {
            score: 60,
            recommendation: "Cơ cấu tín dụng hiện chưa đa dạng. Hãy tiếp tục quản lý tốt các tài khoản hiện có, không cần phát sinh khoản vay mới chỉ để tăng điểm tiêu chí này.",
            priority: "LOW"
        };
    } else if (mix == 2) {
        return {
            score: 75,
            recommendation: "Duy trì cơ cấu tín dụng hiện tại và chú ý khả năng thanh toán tổng thể.",
            priority: "LOW"
        };
    } else if (mix == 3) {
        return {
            score: 90,
            recommendation: "Tiếp tục quản lý các nghĩa vụ tín dụng hiện có và hạn chế phát sinh khoản vay không cần thiết.",
            priority: "LOW"
        };
    } else if (mix >= 4) {
        return {
            score: 100,
            recommendation: "Theo dõi tổng dư nợ, lịch thanh toán và mức độ phù hợp của các khoản tín dụng đang duy trì. ",
            priority: "LOW"
        };
    }
}
function convertNewApplicationScore(new_application) {
    if (new_application == 0) {
        return {
            score: 100,
            recommendation: "Tiếp tục duy trì thói quen chỉ đăng ký tín dụng khi cần thiết.",
            priority: "LOW"
        };
    } else if (new_application == 1) {
        return {
            score: 90,
            recommendation: "Duy trì việc lựa chọn và đăng ký tín dụng dựa trên nhu cầu thực tế.",
            priority: "LOW"
        };
    } else if (new_application == 2) {
        return {
            score: 75,
            recommendation: "Hạn chế gửi nhiều yêu cầu đăng ký trong thời gian ngắn nếu chưa có nhu cầu rõ ràng.",
            priority: "MEDIUM"
        };
    } else if (new_application == 3) {
        return {
            score: 60,
            recommendation: "Theo dõi số lần đăng ký tín dụng và đánh giá khả năng đáp ứng nghĩa vụ tài chính hiện tại.",
            priority: "MEDIUM"
        };
    } else if (new_application == 4) {
        return {
            score: 40,
            recommendation: "Cân nhắc nhu cầu sử dụng tín dụng trước khi gửi thêm yêu cầu đăng ký.",
            priority: "MEDIUM"
        };
    } else if (new_application >= 5) {
        return {
            score: 20,
            recommendation: "Hạn chế những yêu cầu không thực sự cần thiết.",
            priority: "MEDIUM"
        };
    }
}