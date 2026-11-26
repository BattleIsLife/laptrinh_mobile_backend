import { Router } from "express";
import {
    createDebtPayment,
    getDebtPayments,
    getDebtPaymentById,
    recordDebtPayment,
    refreshDebtPayments
} from "../controllers/debt_payment.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyToken);

router.post("/api/debts/:debtId/payments", createDebtPayment);
router.get("/api/debt-payments", getDebtPayments);
router.post("/api/debt-payments/refresh-statuses", refreshDebtPayments);
router.get("/api/debt-payments/:id", getDebtPaymentById);
router.patch("/api/debt-payments/:id", recordDebtPayment);

export default router;