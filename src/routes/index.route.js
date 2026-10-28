import { Router } from 'express';
import checkHealthRoute from './checkHealth.route.js';
import profileRoute from './profile.routes.js';

const router = Router();

router.use(checkHealthRoute);
router.use(profileRoute);
router.use(userRoute);
export default router;