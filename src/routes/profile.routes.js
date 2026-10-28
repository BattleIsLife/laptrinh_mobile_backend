import { Router } from "express";
import { getMyProfile, updateMyProfile } from '../controllers/profile.controller.js';

const router = Router();
router.get('/api/users/:id/profile', getMyProfile);
router.patch('/api/users/:id/profile', updateMyProfile);

export default router;