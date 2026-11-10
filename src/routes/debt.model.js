import { Router } from "express";
import { createDebt, getDebts, getDebtById, updateDebt, deleteDebt } from "../controllers/debt.controller.js";
const router = Router();

router.post("/api/debts", createDebt);
router.get("/api/debts", getDebts);
router.get("/api/debts/:id", getDebtById);
router.put("/api/debts/:id", updateDebt);
router.delete("/api/debts/:id", deleteDebt);

export default router;