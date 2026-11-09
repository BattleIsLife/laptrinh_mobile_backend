import IncomeModel from "../models/income.model.js";
import UserModel from "../models/user.model.js"

const isValidId = (id) => {
    const userId = String(id);
    if (!/^[1-9]\d*$/.test(userId)) {
        return false;
    }
    return BigInt(id) <= 18446744073709551615n;
};
function amountValidator(amount) {
    if (!amount) {
        return { is_valid: false, message: "Số tiền không được để trống" }
    }
    const cleanAmount = Math.floor(Number(amount)).toString(); // chuyển về dạng chuỗi số nguyên 

    if (!/^[1-9]\d{0,12}(\.0{1,2})?$/.test(cleanAmount)) {
        /* Giải thích regex:
            /^, $/: ký hiệu bắt đầu, kết thúc chuỗi regex
            ([1-9]\d{0,12}): Phần số nguyên, bắt đầu  chứa từ 1 đến 13 số bất kỳ có giá trị từ 1-9
            (\.0{1,2})?: Phần thập phân tùy chọn, chỉ cho phép .0 hoặc .00 nếu điền
        */
        return { is_valid: false, message: "Số tiền không được âm và tối đa 13 chữ số, không được chứa số lẻ sau phần thập phân" };
    }
    return { is_valid: true, valid_email: clean_email }
}
function getDaysInMonth(month, year) {
    // month truyền vào từ 0 (Tháng 1) đến 11 (Tháng 12)
    const totalDays = new Date(year, month, 0).getDate(); // Lấy số lượng ngày của tháng đó

    // Tạo mảng các object [{date: "YYYY-MM-DD"}]
    return Array.from({ length: totalDays }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        const monthStr = String(month).padStart(2, '0');
        return `${year}-${monthStr}-${day}`;
    });
}
const now = new Date();
function createIncomeStatisticArray(statistic, month = now.getMonth() + 1, year = now.getFullYear()) {
    // Thêm những ngày không có thu nhập vào mảng thu nhập theo ngày (để vẽ biểu đồ đường) trong khoảng thời gian đó
    // VD: [{"amount":"15000000.00", "date":"2026-06-01"}, {"amount":"15000000.00", "date":"2026-06-05"}, ...]
    // => [{"amount":"15000000.00", "date":"2026-06-01"}, {"amount":"0", "date":"2026-06-02"}, {"amount":"0", "date":"2026-06-03"}, ...]

    const daysInMonth = getDaysInMonth(month, year);
    console.log(daysInMonth);
    const final_statistic = [];
    for(const date of daysInMonth){
        const total_income_by_date = statistic.find((data) => data.date === date);
        if (total_income_by_date) {
            final_statistic.push({amount: total_income_by_date.amount, date:date});
        } else {
            final_statistic.push({amount: "0", date:date});
        }
    }

    return final_statistic;
}
function createIncomeStructureArray(structure, total_income) {
    // Mảng ban đầu có dạng: [{income_type:"SALARY", amount:"150000"}, {income_type:"BUSINESS", amount:"20000"}, ...]
    // Tính tỷ lệ và thêm 0 vào những loại thu nhập không có bản ghi trong khoảng thời gian đó 
    // VD: [{"SALARY": 60, "BUSINESS": 40}] => [{"SALARY": 60, "BUSINESS": 40, "INVESTMENT":0, "OTHER":0}]
    const final_structure = {}
    const INCOME_TYPE = ["SALARY", "BUSINESS", "INVESTMENT", "OTHER"];
    for (const item of INCOME_TYPE) {
        // console.log(item);
        const total_income_by_income_type = structure.find((data) => data.income_type === item);
        // Nếu tìm thấy bản ghi chứng tỏ có dữ liệu thu nhập cho loại thu nhập đó
        if (total_income_by_income_type) {
            final_structure[item] = (Number(total_income_by_income_type.amount) / Number(total_income) * 100).toFixed(2);
        } else {
            final_structure[item] = "0";
        }
    }
    return final_structure;
    // return structure;
}

export const getIncomeTransaction = async (req, res) => {
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
        // Kiểm tra ID giao dịch thu nhập
        const id = parseInt(req.params.id);
        if (!isValidId(id)) {
            return res.status(400).send({
                status: "false",
                message: "Mã giao dịch thu nhập không hợp lệ"
            });
        }
        // Không tìm thấy giao dịch
        const income_transaction_data = await IncomeModel.getIncomeTransaction(id, user_id);
        if (!income_transaction_data) {
            return res.status(404).send({
                status: "false",
                message: "Không tìm thấy giao dịch thu nhập"
            });
        }
        // Tìm thấy giao dịch
        return res.status(200).send({
            status: "success",
            message: "Lấy thông tin giao dịch thu nhập thành công",
            data: income_transaction_data
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const getIncomeTransactions = async (req, res) => {
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
        const { page, month, year } = req.query;

        // Kiểm tra xem page trên query string có phải số thật ko
        if (Number.isFinite(Number(page))) {
            const transactions_data = await IncomeModel.getAllIncomeTransactions(user_id, page, month, year);
            return res.status(200).send({
                status: "success",
                message: "Lấy danh sách thu nhập thành công",
                data: transactions_data,
                total_items: Object.keys(transactions_data).length
            });
        } else {
            // Không phải số thì mặc định dùng page = 0
            const transactions_data = await IncomeModel.getAllIncomeTransactions(user_id, 0, month, year);
            return res.status(200).send({
                status: "success",
                message: "Lấy danh sách thu nhập thành công",
                data: transactions_data,
                total_items: Object.keys(transactions_data).length
            });
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const getStatistic = async (req, res) => {
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
        const { month, year } = req.query;
        // console.log(user_id + " " + month + " " + year)
        const statistic = await IncomeModel.getStatistic(user_id, month, year);
        const total_income = await IncomeModel.getTotalIncome(user_id, month, year);
        const structure = await IncomeModel.getIncomeStructure(user_id, month, year);
        return res.status(200).send({
            status: "success",
            message: "Lấy thống kê thu nhập thành công",
            total_income: total_income,
            data: createIncomeStatisticArray(statistic, month, year),
            struture: createIncomeStructureArray(structure, total_income)
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const addIncomeTransaction = async (req, res) => {

}

export const updateIncomeTransaction = async (req, res) => {

}

export const deleteIncomeTransaction = async (req, res) => {

}
