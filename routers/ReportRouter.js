import {Router} from "express";
import reportController from "../controllers/ReportController.js";
import {authenticationBarrier} from "../middleware/Authentication.js";
let router = new Router();
router.get('/report/:type/:param', authenticationBarrier, reportController.handleReportRequest);
router.get('/expense/:yearmonth{/:id}', authenticationBarrier, reportController.handleExpenseRequest);
router.get('/revenue/:yearmonth{/:id}', authenticationBarrier, reportController.handleRevenueRequest);
router.get('/report/apar', authenticationBarrier, reportController.handleAparReport);
router.get('/reports', authenticationBarrier, reportController.reportList);
router.get('/prepare-report/:reportName', authenticationBarrier, reportController.prepareReport);
router.post('/run-report/:reportName', authenticationBarrier, reportController.handleRunReport)
export default router;