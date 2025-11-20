import {Router} from "express";
import accountController from "../controllers/UAccountController.js";
import authenticationBarrier from "../middleware/AuthenticationBarrier.js";
const router = Router();
router.get('/admin/user-accounts', accountController.allUserAccounts);
router.get('/me', authenticationBarrier, accountController.me)
router.get('/register', accountController.registrationPage)
router.post('/register', accountController.registerAccount)
export default router;