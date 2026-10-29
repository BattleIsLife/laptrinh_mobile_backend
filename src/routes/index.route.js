import { Router } from 'express';
import checkHealthRoute from './checkHealth.route.js';
import profileRoute from './profile.routes.js';

const router = Router();

router.use(checkHealthRoute);
router.use(profileRoute);

export default router;