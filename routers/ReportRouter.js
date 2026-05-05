import {Router} from "express";
import reportController from "../controllers/ReportController.js";
import {authenticationBarrier} from "../middleware/Authentication.js";
let router = new Router();
router.get('/report/:type/:param', authenticationBarrier, reportController.handleReportRequest);
router.get('/expense/:yearmonth{/:id}', authenticationBarrier, reportController.handleExpenseRequest);
router.get('/revenue/:yearmonth{/:id}', authenticationBarrier, reportController.handleRevenueRequest);
export default router;