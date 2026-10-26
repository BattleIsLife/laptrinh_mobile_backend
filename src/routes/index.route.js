import { Router } from 'express';
import checkHealthRoute from './checkHealth.route.js';
import authRoute from './auth.route.js';
import testAuth from './testAuth.route.js';

const router = Router();

router.use(checkHealthRoute);
router.use(authRoute); 
router.use(testAuth);

export default router;