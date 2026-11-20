import { Router } from "express";
import { createDebtPayment, getDebtPayments, getDebtPaymentById, updateDebtPayment, deleteDebtPayment } from "../controllers/debt_payment.controller.js";
const router = Router();
router.post("/api/debt-payments", createDebtPayment);
router.get("/api/debt-payments", getDebtPayments);
router.get("/api/debt-payments/:id", getDebtPaymentById);
router.put("/api/debt-payments/:id", updateDebtPayment);
router.delete("/api/debt-payments/:id", deleteDebtPayment);
export default router;