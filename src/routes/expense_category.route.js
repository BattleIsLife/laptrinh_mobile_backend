import { Router } from 'express'
import { getExpenseCaterogies } from '../controllers/expense_category.controller.js';
const router = Router();

router.get("/api/expense_categories", getExpenseCaterogies) // Lấy danh sách các danh mục chi tiêu

export default router;