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
    if (typeof amount !== 'string') {
        return { is_valid: false, message: 'Số tiền phải là một chuỗi ký tự số' };
    }

    if (!/^[1-9]\d{0,12}$/.test(amount)) {
        /* Giải thích regex:
            /^, $/: ký hiệu bắt đầu, kết thúc chuỗi regex
            ([1-9]\d{0,12}): Phần số nguyên, bắt đầu từ từ 1 đến 9; các giá trị phía sau từ 0 đến 9, tối thiểu 0 và tối đa 12
        */
        return { is_valid: false, message: "Số tiền không được âm, giá trị tối thiểu là 1 và chứa tối đa 13 chữ số, không được chứa phần thập phân" };
    }
    return { is_valid: true, valid_amount: amount }
}
function incomeTypeValidator(income_type) {
    const valid_income_type = ["SALARY", "BUSINESS", "INVESTMENT", "OTHER"];
    if (valid_income_type.find((type) => income_type === type) === undefined) {
        return { is_valid: false, message: "Loại thu nhập không hợp lệ" }
    }
    return { is_valid: true, valid_income_type: income_type }
}
function transactionDateValidator(transaction_date) {
    // Kiểm tra không được để trống (null, undefined, chuỗi rỗng, hoặc chỉ toàn khoảng trắng)
    if (transaction_date === null || transaction_date === undefined || (typeof transaction_date === 'string' && transaction_date.trim() === '')) {
        return { is_valid: false, message: "Ngày giao dịch không được để trống" };
    }
    // Ép kiểu về string và xóa khoảng trắng thừa ở 2 đầu (nếu có)
    const clean_date = String(transaction_date).trim();
    // Kiểm tra định dạng YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean_date)) {
        return {
            is_valid: false, message: "Ngày giao dịch không hợp lệ (phải có dạng YYYY-MM-DD và năm lớn hơn 1900)"
        };
    }

    // Tách năm, tháng, ngày
    const [year, month, day] = clean_date.split('-').map(Number);
    // Kiểm tra điều kiện năm lớn hơn 1000
    if (year <= 1900) {
        return { is_valid: false, message: "Ngày giao dịch không hợp lệ (phải có dạng YYYY-MM-DD và năm lớn hơn 1900)" };
    }

    // Kiểm tra tính logic của ngày tháng (dùng UTC để tránh lệch múi giờ)
    const date = new Date(Date.UTC(year, month - 1, day));
    const is_logical = date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
    if (!is_logical) {
        return {
            is_valid: false, message: "Ngày giao dịch không hợp lệ (phải có dạng YYYY-MM-DD và năm lớn hơn 1900)"
        };
    }
    return { is_valid: true, valid_date: clean_date };
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
    for (const date of daysInMonth) {
        const total_income_by_date = statistic.find((data) => data.date === date);
        if (total_income_by_date) {
            final_statistic.push({ amount: total_income_by_date.amount, date: date });
        } else {
            final_statistic.push({ amount: "0", date: date });
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
                total_items: transactions_data.length
            });
        } else {
            // Không phải số thì mặc định dùng page = 0
            const transactions_data = await IncomeModel.getAllIncomeTransactions(user_id, 0, month, year);
            return res.status(200).send({
                status: "success",
                message: "Lấy danh sách thu nhập thành công",
                data: transactions_data,
                total_items: transactions_data.length
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
            structure: createIncomeStructureArray(structure, total_income)
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const addIncomeTransaction = async (req, res) => {
    try {
        const user_id = parseInt(req.user.id);
        const profile = await UserModel.getProfile(user_id);
        if (!profile) {
            return res.status(404).json({
                status: "false",
                message: 'Người dùng không tồn tại'
            });
        }
        const { source, amount, income_type, transaction_date, description } = req.body;
        const errors = {}
        const valid_data = {}
        valid_data.user_id = user_id; // gán mã người dùng cần thêm
        // Validate dữ liệu
        if (!source) {
            valid_data.source = "";
        } else {
            if (source.length > 50) {
                errors.source = "Tên nguồn thu nhập không được quá 50 ký tự";
            } else {
                valid_data.source = source;
            }
        }
        const amount_validator = amountValidator(amount);
        if (amount_validator.is_valid == false) {
            errors.amount = amount_validator.message;
        } else {
            valid_data.amount = amount_validator.valid_amount;
        }
        const income_type_validator = incomeTypeValidator(income_type);
        if (income_type_validator.is_valid == false) {
            errors.income_type = income_type_validator.message;
        } else {
            valid_data.income_type = income_type_validator.valid_income_type;
        }
        const transaction_date_validator = transactionDateValidator(transaction_date);
        if (transaction_date_validator.is_valid == false) {
            errors.transaction_date = transaction_date_validator.message;
        } else {
            valid_data.transaction_date = transaction_date_validator.valid_date;
        }
        if (!description) {
            valid_data.description = "";
        } else {
            if (description.length > 255) {
                errors.description = "Mô tả không được quá 255 ký tự";
            } else {
                valid_data.description = description;
            }
        }
        if (Object.keys(errors).length !== 0) {
            return res.status(400).send({ status: "false", message: "Dữ liệu đầu vào không hợp lệ", errors: errors })
        }
        const insertedId = await IncomeModel.addIncomeTransaction(valid_data);
        if (insertedId) {
            return res.status(201).json({ status: "success", message: "Tạo giao dịch thu nhập thành công" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const updateIncomeTransaction = async (req, res) => {
    try {
        // Kiểm tra người dùng có tồn tại 
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
                message: "Không tìm thấy giao dịch thu nhập để cập nhật"
            });
        }
        const { source, amount, income_type, transaction_date, description } = req.body;
        const errors = {}
        const valid_data = {}
        valid_data.transaction_id = id; // gán mã giao dịch cần cập nhật
        // Validate dữ liệu
        if (!source) {
            valid_data.source = "";
        } else {
            if (source.length > 50) {
                errors.source = "Tên nguồn thu nhập không được quá 50 ký tự";
            } else {
                valid_data.source = source;
            }
        }
        const amount_validator = amountValidator(amount);
        if (amount_validator.is_valid == false) {
            errors.amount = amount_validator.message;
        } else {
            valid_data.amount = amount_validator.valid_amount;
        }
        const income_type_validator = incomeTypeValidator(income_type);
        if (income_type_validator.is_valid == false) {
            errors.income_type = income_type_validator.message;
        } else {
            valid_data.income_type = income_type_validator.valid_income_type;
        }
        const transaction_date_validator = transactionDateValidator(transaction_date);
        if (transaction_date_validator.is_valid == false) {
            errors.transaction_date = transaction_date_validator.message;
        } else {
            valid_data.transaction_date = transaction_date_validator.valid_date;
        }
        if (!description) {
            valid_data.description = "";
        } else {
            if (description.length > 255) {
                errors.description = "Mô tả không được quá 255 ký tự";
            } else {
                valid_data.description = description;
            }
        }
        if (Object.keys(errors).length !== 0) {
            return res.status(400).send({ status: "false", message: "Dữ liệu đầu vào không hợp lệ", errors: errors })
        }
        // return res.status(200).json({ status: "success", message: "Cập nhật giao dịch thu nhập thành công", data: valid_data});
        const affectedRows = await IncomeModel.updateIncomeTransaction(valid_data);
        if (affectedRows == 1) {
            return res.status(200).json({ status: "success", message: "Cập nhật giao dịch thu nhập thành công" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const deleteIncomeTransaction = async (req, res) => {
    try {
        // Kiểm tra người dùng có tồn tại 
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
                message: "Không tìm thấy giao dịch thu nhập để xóa"
            });
        }
        const affectedRows = await IncomeModel.deleteIncomeTransaction(id);
        if (affectedRows == 1) {
            return res.status(200).json({ status: "success", message: "Xóa giao dịch thu nhập thành công" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}
