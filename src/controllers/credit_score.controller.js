import CreditScoreModel from "../models/credit_score.model.js";

const isValidId = (id) => {
    const parsedId = String(id);
    if (!/^[1-9]\d*$/.test(parsedId)) {
        return false;
    }
    return BigInt(id) <= 18446744073709551615n;
};
export const calculateCreditScore = async (req, res) => {
    try {

        return res.status(201).send({
            status: "success",
            message: "Tính điểm tín dụng thành công",
        });
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
            recommendation: "Rà soát các khoản chi tiêu bằng tín dụng và cân nhắc giảm dư nợ hiện tại. ",
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
            recommendation: "Theo dõi dư nợ và hạn chế sử dụng thêm hạn mức nếu không cần thiết. ",
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
            recommendation: "Tiếp tục duy trì mức sử dụng hạn mức hiện tại để giữ mức điểm cao. ",
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
            recommendation: "Lịch sử tín dụng còn ngắn. Hãy duy trì các tài khoản hiện có một cách có trách nhiệm và thanh toán đúng hạn. ",
            priority: "LOW"
        };
    } else if (age <= 3) {
        return { 
            score: 60, 
            recommendation: "Tiếp tục xây dựng lịch sử tín dụng ổn định và tránh phát sinh các tài khoản không cần thiết. ",
            priority: "LOW" 
        };
    } else if (age <= 5) {
        return { 
            score: 75, 
            recommendation: "Duy trì các tài khoản hiện tại và theo dõi lịch sử thanh toán thường xuyên. ",
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
            recommendation: "Lịch sử tín dụng đã được duy trì trong thời gian dài. Tiếp tục quản lý các tài khoản hiện có hợp lý. ",
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
    if (mix = 0) {
        return {
            score: 50, 
            recommendation: "Chưa có dữ liệu về cơ cấu tín dụng. Không cần mở khoản vay để cải thiện tiêu chí này.",
            priority: "LOW"
        };
    } else if (mix = 1) {
        return { 
            score: 60, 
            recommendation: "Cơ cấu tín dụng hiện chưa đa dạng. Hãy tiếp tục quản lý tốt các tài khoản hiện có, không cần phát sinh khoản vay mới chỉ để tăng điểm tiêu chí này.",
            priority: "LOW" 
        };
    } else if (mix = 2) {
        return { 
            score: 75, 
            recommendation: "Duy trì cơ cấu tín dụng hiện tại và chú ý khả năng thanh toán tổng thể.",
            priority: "LOW" 
        };
    } else if (mix = 3) {
        return { 
            score: 90, 
            recommendation: "Tiếp tục quản lý các nghĩa vụ tín dụng hiện có và hạn chế phát sinh khoản vay không cần thiết.",
            priority: "LOW" 
        };
    } else if (mix >= 4) {
        return { 
            score: 90, 
            recommendation: "Theo dõi tổng dư nợ, lịch thanh toán và mức độ phù hợp của các khoản tín dụng đang duy trì. ",
            priority: "LOW" 
        };
    }
}
function convertNewApplicationScore(new_application) {
    if (new_application = 0) {
        return {
            score: 100, 
            recommendation: "Tiếp tục duy trì thói quen chỉ đăng ký tín dụng khi cần thiết. ",
            priority: "LOW"
        };
    } else if (new_application = 1) {
        return { 
            score: 75, 
            recommendation: "Duy trì việc lựa chọn và đăng ký tín dụng dựa trên nhu cầu thực tế. ",
            priority: "LOW" 
        };
    } else if (new_application = 2) {
        return { 
            score: 60, 
            recommendation: "Hạn chế gửi nhiều yêu cầu đăng ký trong thời gian ngắn nếu chưa có nhu cầu rõ ràng. ",
            priority: "MEDIUM" 
        };
    } else if (new_application = 3) {
        return { 
            score: 90, 
            recommendation: "Theo dõi số lần đăng ký tín dụng và đánh giá khả năng đáp ứng nghĩa vụ tài chính hiện tại. ",
            priority: "MEDIUM" 
        };
    } else if (new_application = 4) {
        return { 
            score: 90, 
            recommendation: "Cân nhắc nhu cầu sử dụng tín dụng trước khi gửi thêm yêu cầu đăng ký. ",
            priority: "MEDIUM" 
        };
    }else if (new_application >= 5) {
        return { 
            score: 90, 
            recommendation: "Hạn chế những yêu cầu không thực sự cần thiết. ",
            priority: "MEDIUM" 
        };
    }
}