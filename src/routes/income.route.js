import { Router } from 'express'
import { getIncomeTransactions, getIncomeTransaction, getStatistic, addIncomeTransaction, updateIncomeTransaction, deleteIncomeTransaction} from '../controllers/income.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
const router = Router();

router.route("/api/income")
.get(verifyToken, getIncomeTransactions) // Lấy danh sách các giao dịch thu nhập
.post(verifyToken, addIncomeTransaction) // Tạo một giao dịch thu nhập

// Lấy dữ liệu thống kê thu nhập
router.get("/api/income/statistic",verifyToken, getStatistic)

router.route("/api/income/:id")
.get(verifyToken, getIncomeTransaction) // Lấy thông tin 1 giao dịch thu nhập 
.put(verifyToken, updateIncomeTransaction) // Cập nhật một giao dịch thu nhập
.delete(verifyToken, deleteIncomeTransaction) // Xóa một giao dịch thu nhập

export default router;