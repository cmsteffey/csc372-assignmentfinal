import fAccountController from "../controllers/FAccountController.js";
import {Router} from "express";
import {authenticationBarrier} from "../middleware/Authentication.js";

let router = new Router();
router.get('/my-accounts', authenticationBarrier, fAccountController.myFAccountsPage);
router.get('/add-account', authenticationBarrier, fAccountController.addFAccountPage);
router.post('/add-account', authenticationBarrier, fAccountController.handleAddFAccountForm);
router.get("/add-stock-account", authenticationBarrier, fAccountController.addStockFAccountPage);
router.post("/add-stock-account", authenticationBarrier, fAccountController.handleAddStockFAccountForm);
export default router;