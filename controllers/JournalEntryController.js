import journalEntryModel from "../models/JournalEntry.js"
import fAccount from "../models/FAccount.js";
async function myJournalEntriesPage(req,res){
    res.render('journal-entries-list', {
        pageTitle: "My Journal Entries",
        portions: (await journalEntryModel.getTransactionPortionsForUser(req.authenticatedUser.id))

    })
}
async function addJournalEntryPage(req,res){
    res.render('add-journal-entry', {
        prefill: req.body,
        rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) + 1 : 2,
        accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
    })
}
async function handleJournalEntryForm(req,res){
    if(typeof req.body.name !== "string" || req.body.name.length === 0){
        res.render('add-journal-entry', {
            error: "Error: Entry name is required",
            prefill: req.body,
            rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
            accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
        });
        return;
    }
    let rowCount;
    if(typeof req.body.rowCount !== "string" || isNaN((rowCount = parseInt(req.body.rowCount))) || rowCount % 1 !== 0){
        res.status(400).send("rowCount is not a whole number or not supplied");
        return;
    }
    let portions = Array(rowCount);
    for(let i = 0; i < rowCount;++i){
        portions[i] = {};
        if(typeof req.body["account_id_" + i] !== "string" || isNaN((portions[i].account_id = parseInt(req.body["account_id_" + i])))){
            res.status(400).send("Bad or missing account_id in row " + (i + 1));
            return;
        }
        if(typeof req.body["debit_" + i] !== "string"){
            res.render('add-journal-entry', {
                error: "Error: Bad debit in row " + (i + 1),
                prefill: req.body,
                rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
            });
            return;
        }
        if(typeof req.body["credit_" + i] !== "string"){
            res.render('add-journal-entry', {
                error: "Error: Bad credit in row " + (i + 1),
                prefill: req.body,
                rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
            });
            return;
        }
        if(isNaN(portions[i].debit = parseInt(req.body["debit_" + i])) === isNaN(portions[i].credit = parseInt(req.body["credit_" + i]))){
            res.render('add-journal-entry', {
                error: "Error: Row " + (i + 1) + " has " + (isNaN(portions[i].debit) ? "no" : "two") + " amount values",
                prefill: req.body,
                rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
            });
            return;
        }
        portions[i].amount = isNaN(portions[i].credit) ? portions[i].debit : -portions[i].credit;
    }
    if(portions.reduce((acc, x) => acc + x.amount, 0) !== 0){
        res.render('add-journal-entry', {
            error: "Error: Debit and credit totals are not equal",
            prefill: req.body,
            rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
            accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
        });
        return;
    }
    if(await fAccount.getOwnerForAccounts(portions.map(x=>x.account_id)) !== req.authenticatedUser.id){
        res.render('add-journal-entry', {
            error: "Error: One or more accounts specified are invalid and/or deleted",
            prefill: req.body,
            rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
            accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
        });
        return;
    }
    let journalEntryId = await journalEntryModel.createJournalEntry(req.body.name);
    await journalEntryModel.fillJournalEntry(journalEntryId, portions);
    res.redirect('/my-journal-entries');

}
export default {myJournalEntriesPage, addJournalEntryPage, handleJournalEntryForm}