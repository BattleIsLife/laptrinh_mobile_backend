import { Router } from 'express';
import checkHealthRoute from './checkHealth.route.js';
<<<<<<< HEAD
import profileRoute from './profile.routes.js';
=======
import authRoute from './auth.route.js';
import testAuth from './testAuth.route.js';
>>>>>>> main

const router = Router();

router.use(checkHealthRoute);
<<<<<<< HEAD
router.use(profileRoute);
=======
router.use(authRoute); 
router.use(testAuth);
>>>>>>> main

export default router;