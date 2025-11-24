import {Router} from "express";
import journalEntryController from "../controllers/JournalEntryController.js";
import {authenticationBarrier} from "../middleware/Authentication.js";
let router = new Router();
router.get('/add-journal-entry', authenticationBarrier, journalEntryController.addJournalEntryPage);
router.post('/add-journal-entry', authenticationBarrier, journalEntryController.addJournalEntryPage);
router.post('/add-journal-entry-submit', authenticationBarrier, journalEntryController.handleJournalEntryForm);
router.get("/update-stock-account/:account_id", authenticationBarrier, journalEntryController.updateStockPage)
router.get('/my-journal-entries', authenticationBarrier, journalEntryController.myJournalEntriesPage);
export default router;