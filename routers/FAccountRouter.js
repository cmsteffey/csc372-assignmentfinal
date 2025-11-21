import fAccountController from "../controllers/FAccountController.js";
import {Router} from "express";
import {authenticationBarrier} from "../middleware/Authentication.js";

let router = new Router();
router.get('/my-accounts', authenticationBarrier, fAccountController.myFAccountsPage);
router.get('/add-account', authenticationBarrier, fAccountController.addFAccountPage);
router.post('/add-account', authenticationBarrier, fAccountController.handleAddFAccountForm);
export default router;