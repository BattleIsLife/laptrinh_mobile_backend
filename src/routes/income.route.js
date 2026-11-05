import { Router } from 'express'
import { getIncomeTransactions, getIncomeTransaction, addIncomeTransaction, updateIncomeTransaction, deleteIncomeTransaction, getLineChart } from '../controllers/income.controller';
const router = Router();

// Lấy thông tin 1 giao dịch thu nhập 
router.get("/api/income/:id", getIncomeTransaction)

// Lấy danh sách các thu nhập
router.get("/api/income/", getIncomeTransactions)

// Lấy biểu đồ đường thu nhập theo thời gian
router.get("/api/income/statistic", getLineChart)

// Sửa một giao dịch thu nhập
router.post("/api/income/", addIncomeTransaction)

// Cập nhật một giao dịch thu nhập
router.put("/api/income", updateIncomeTransaction)

// Xóa một giao dịch thu nhập
router.delete("/api/income", deleteIncomeTransaction)

export default router;