import {Router} from "express";
import journalEntryController from "../controllers/JournalEntryController.js";
import {authenticationBarrier} from "../middleware/Authentication.js";
import {finalNonEmptyWins} from "../middleware/FinalNonEmptyWins.js"
let router = new Router();
router.get('/add-journal-entry', authenticationBarrier, journalEntryController.addJournalEntryPage);
router.post('/add-journal-entry', authenticationBarrier, finalNonEmptyWins, journalEntryController.addJournalEntryPage);
router.post('/add-journal-entry-submit', authenticationBarrier, journalEntryController.handleJournalEntryForm);
router.post('/add-journal-entry-submit-mobile', authenticationBarrier, (req, res, next) => {req.mobile = true; next();}, journalEntryController.handleJournalEntryForm);
router.get("/update-stock-account/:account_id", authenticationBarrier, journalEntryController.updateStockPage)
router.get('/my-journal-entries', authenticationBarrier, journalEntryController.myJournalEntriesPage);
router.post("/journal-entries-search", authenticationBarrier, journalEntryController.journalEntrySearch)
export default router;