import { Router } from 'express'
import { register, login, get_otp, reset_password } from '../controllers/auth.controller.js';
const router = Router();

router.post("/api/auth/register", register)
router.post("/api/auth/login", login)
router.post("/api/auth/get_otp", get_otp)
router.post("/api/auth/reset_password", reset_password)

export default router;