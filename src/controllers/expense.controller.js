import ExpenseModel from "../models/expense.model.js";
import ExpenseCategoryModel from "../models/expense_category.model.js";
import UserModel from "../models/user.model.js"

const isValidId = (id) => {
    const expenseId = String(id);
    if (!/^[1-9]\d*$/.test(expenseId)) {
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
function createExpenseStatisticArray(statistic, month = now.getMonth() + 1, year = now.getFullYear()) {
    // Có thể đọc comment của hàm bên income.controller.js với logic tương tự
    const daysInMonth = getDaysInMonth(month, year);
    // console.log(daysInMonth);
    const final_statistic = [];
    for (const date of daysInMonth) {
        const total_expense_by_date = statistic.find((data) => data.date === date);
        if (total_expense_by_date) {
            final_statistic.push({ amount: total_expense_by_date.amount, date: date });
        } else {
            final_statistic.push({ amount: "0", date: date });
        }
    }
    return final_statistic;
}
async function createExpenseStructureArray(structure, total_expense) {
    const final_structure = {}
    const EXPENSE_CATEGORIES = await ExpenseCategoryModel.getExpenseCaterogies();
    // console.log(EXPENSE_CATEGORIES)
    for (const category of EXPENSE_CATEGORIES) {
        const total_expense_by_category = structure.find((data) => data.category_id === category.id);
        // Nếu tìm thấy bản ghi chứng tỏ có dữ liệu chi tiêu cho loại chi tiêu đó
        if (total_expense_by_category) {
            final_structure[category.name] = (Number(total_expense_by_category.amount) / Number(total_expense) * 100).toFixed(2);
        } else {
            final_structure[category.name] = "0";
        }
    }
    return final_structure;
    // return structure;
}
function calculateExpenseRate(essential_amount, total_expense) {
    if (total_expense == 0) {
        return 0;
    } else {
        return (Number(essential_amount) / Number(total_expense) * 100).toFixed(2);
    }
}

export const getExpenseTransaction = async (req, res) => {
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
        // Kiểm tra ID giao dịch chi tiêu 
        const id = parseInt(req.params.id);
        if (!isValidId(id)) {
            return res.status(400).send({
                status: "false",
                message: "Mã giao dịch chi tiêu không hợp lệ"
            });
        }
        // Không tìm thấy giao dịch
        const expense_transaction_data = await ExpenseModel.getExpenseTransaction(id, user_id);
        if (!expense_transaction_data) {
            return res.status(404).send({
                status: "false",
                message: "Không tìm thấy giao dịch thu nhập"
            });
        }
        // Tìm thấy giao dịch
        return res.status(200).send({
            status: "success",
            message: "Lấy thông tin giao dịch thu nhập thành công",
            data: expense_transaction_data
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const getExpenseTransactions = async (req, res) => {
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
        const { page, month, year } = req.query;

        // Kiểm tra xem page trên query string có phải số thật ko
        if (Number.isFinite(Number(page))) {
            const transactions_data = await ExpenseModel.getAllExpenseTransactions(user_id, page, month, year);
            return res.status(200).send({
                status: "success",
                message: "Lấy danh sách chi tiêu thành công",
                data: transactions_data,
                total_items: transactions_data.length
            });
        } else {
            // Không phải số thì mặc định dùng page = 0
            const transactions_data = await ExpenseModel.getAllExpenseTransactions(user_id, 0, month, year);
            return res.status(200).send({
                status: "success",
                message: "Lấy danh sách chi tiêu thành công",
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
        const statistic = await ExpenseModel.getStatistic(user_id, month, year);
        const total_expense = await ExpenseModel.getTotalExpense(user_id, month, year);
        const structure = await ExpenseModel.getExpenseStructure(user_id, month, year);
        const essential_amount = await ExpenseModel.getEssentialAmount(user_id, month, year);
        return res.status(200).send({
            status: "success",
            message: "Lấy thống kê chi tiêu thành công",
            total_expense: total_expense,
            data: createExpenseStatisticArray(statistic, month, year),
            structure: await createExpenseStructureArray(structure, total_expense),
            essential_rate: calculateExpenseRate(essential_amount, total_expense)
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const addExpenseTransaction = async (req, res) => {
    try {
        const user_id = parseInt(req.user.id);
        const profile = await UserModel.getProfile(user_id);
        if (!profile) {
            return res.status(404).json({
                status: "false",
                message: 'Người dùng không tồn tại'
            });
        }
        const { amount, category_id, transaction_date, description } = req.body;
        const errors = {}
        const valid_data = {}
        valid_data.user_id = user_id; // gán mã người dùng cần thêm
        // Validate dữ liệu
        const amount_validator = amountValidator(amount);
        if (amount_validator.is_valid == false) {
            errors.amount = amount_validator.message;
        } else {
            valid_data.amount = amount_validator.valid_amount;
        }
        if (!category_id) {
            errors.category_id = "Bạn chưa chọn danh mục chi tiêu";
        } else if (!isValidId(category_id)) {
            errors.category_id = "Mã danh mục chi tiêu không hợp lệ";
        }
        else {
            const category = await ExpenseCategoryModel.getExpenseCaterogy(category_id)
            if (!category) {
                errors.category_id = "Không tìm thấy danh mục chi tiêu hoặc danh mục không hợp lệ";
            } else {
                valid_data.category_id = category_id;
            }
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
        const insertedId = await ExpenseModel.addExpenseTransaction(valid_data);
        if (insertedId) {
            return res.status(201).json({ status: "success", message: "Tạo giao dịch chi tiêu thành công" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const updateExpenseTransaction = async (req, res) => {
    try {
        const user_id = parseInt(req.user.id);
        const profile = await UserModel.getProfile(user_id);
        if (!profile) {
            return res.status(404).json({
                status: "false",
                message: 'Người dùng không tồn tại'
            });
        }
        // Kiểm tra ID giao dịch chi tiêu
        const id = parseInt(req.params.id);
        if (!isValidId(id)) {
            return res.status(400).send({
                status: "false",
                message: "Mã giao dịch chi tiêu không hợp lệ"
            });
        }
        // Không tìm thấy giao dịch
        const expense_transaction_data = await ExpenseModel.getExpenseTransaction(id, user_id);
        if (!expense_transaction_data) {
            return res.status(404).send({
                status: "false",
                message: "Không tìm thấy giao dịch chi tiêu để cập nhật"
            });
        }
        const { amount, category_id, transaction_date, description } = req.body;
        const errors = {}
        const valid_data = {}
        valid_data.transaction_id = id; // gán mã giao dịch cần cập nhật
        // Validate dữ liệu
        const amount_validator = amountValidator(amount);
        if (amount_validator.is_valid == false) {
            errors.amount = amount_validator.message;
        } else {
            valid_data.amount = amount_validator.valid_amount;
        }
        if (!category_id) {
            errors.category_id = "Bạn chưa chọn danh mục chi tiêu";
        } else if (!isValidId(category_id)) {
            errors.category_id = "Mã danh mục chi tiêu không hợp lệ";
        }
        else {
            const category = await ExpenseCategoryModel.getExpenseCaterogy(category_id)
            if (!category) {
                errors.category_id = "Không tìm thấy danh mục chi tiêu hoặc danh mục không hợp lệ";
            } else {
                valid_data.category_id = category_id;
            }
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
        const insertedId = await ExpenseModel.updateExpenseTransaction(valid_data);
        if (insertedId) {
            return res.status(201).json({ status: "success", message: "Cập nhật giao dịch chi tiêu thành công" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}

export const deleteExpenseTransaction = async (req, res) => {
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
                message: "Mã giao dịch chi tiêu không hợp lệ"
            });
        }
        // Không tìm thấy giao dịch
        const expense_transaction_data = await ExpenseModel.getExpenseTransaction(id, user_id);
        if (!expense_transaction_data) {
            return res.status(404).send({
                status: "false",
                message: "Không tìm thấy giao dịch chi tiêu để xóa"
            });
        }
        const affectedRows = await ExpenseModel.deleteExpenseTransaction(id);
        if (affectedRows == 1) {
            return res.status(200).json({ status: "success", message: "Xóa giao dịch chi tiêu thành công" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}
