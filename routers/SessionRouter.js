import {Router} from 'express';
import sessionController from "../controllers/SessionController.js"

let router = Router();
router.post("/login", sessionController.handleLoginForm);
router.get("/login", sessionController.loginPage);
export default router;