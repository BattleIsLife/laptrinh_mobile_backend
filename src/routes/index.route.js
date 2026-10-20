import { Router } from 'express';
import checkHealthRoute from './checkHealth.route.js';

const router = Router();

router.use(checkHealthRoute);

export default router;