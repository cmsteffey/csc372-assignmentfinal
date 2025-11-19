import {Router} from "express";
import accountController from "../controllers/UAccountController.js";
const router = Router();
router.get('/admin/user-accounts', accountController.getAllAccounts)
export default router;