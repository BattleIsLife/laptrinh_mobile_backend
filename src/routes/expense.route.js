import { Router } from 'express'
import { getExpenseTransaction, getExpenseTransactions, getStatistic, addExpenseTransaction, updateExpenseTransaction, deleteExpenseTransaction} from '../controllers/expense.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
const router = Router();

router.route("/api/expense")
.get(verifyToken, getExpenseTransactions) // Lấy danh sách các giao dịch chi tiêu
.post(verifyToken, addExpenseTransaction) // Tạo một giao dịch chi tiêu

// Lấy dữ liệu thống kê chi tiêu
router.get("/api/expense/statistic",verifyToken, getStatistic)

router.route("/api/expense/:id")
.get(verifyToken, getExpenseTransaction) // Lấy thông tin 1 giao dịch chi tiêu 
.put(verifyToken, updateExpenseTransaction) // Cập nhật một giao dịch chi tiêu
.delete(verifyToken, deleteExpenseTransaction) // Xóa một giao dịch chi tiêu

export default router;