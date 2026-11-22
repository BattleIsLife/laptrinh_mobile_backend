import { Router } from 'express';
import checkHealthRoute from './checkHealth.route.js';
import profileRoute from './profile.routes.js';

import authRoute from './auth.route.js';
import testAuth from './testAuth.route.js';
import creditAccoutRoute from './credit_account.route.js';
import assetRoute from './asset.route.js';
import incomeRoute from './income.route.js';
import savingRoute from './saving.route.js';
import expenseRoute from './expense.route.js'
import categoryExpenseRoute from './expense_category.route.js'


import healthScoreRoute from './health_score.route.js'


const router = Router();
router.use(checkHealthRoute);
router.use(profileRoute);
router.use(authRoute); 
router.use(testAuth);
router.use(creditAccoutRoute);
router.use(assetRoute);
router.use(incomeRoute);
router.use(savingRoute);
router.use(expenseRoute);
router.use(categoryExpenseRoute);

router.use(healthScoreRoute);
export default router;
