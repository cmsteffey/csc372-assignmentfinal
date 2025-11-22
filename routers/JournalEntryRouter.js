import {Router} from "express";
import journalEntryController from "../controllers/JournalEntryController.js";
let router = new Router();
//router.get('/add-journal-entry', journalEntryController.)
//router.post('/add-journal-entry', )
router.get('/my-journal-entries', journalEntryController.myJournalEntriesPage);
export default router;