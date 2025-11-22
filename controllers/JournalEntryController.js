import journalEntryModel from "../models/JournalEntry.js"
import fAccountType from "../models/FAccountType.js";
async function myJournalEntriesPage(req,res){
    res.render('journal-entries-list', {
        pageTitle: "My Journal Entries",
        portions: (await journalEntryModel.getTransactionPortionsForUser(req.authenticatedUser.id)).map(x=>({...x,isDebit: x.amount > 0 === fAccountType[x.faccount_category].debitIncrease}))

    })
}
async function addJournalEntryPage(req,res){
    res.render('add-journal-entry', {
        preFilled: {

        }
    })
}
export default {myJournalEntriesPage}