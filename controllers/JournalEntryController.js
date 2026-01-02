import journalEntryModel from "../models/JournalEntry.js"
import fAccountModel from "../models/FAccount.js";
import fAccountType from "../models/FAccountType.js"
import {parseDollarValue} from "../common/functions.js";
async function myJournalEntriesPage(req,res){
    res.render('journal-entries-list', {
        pageTitle: "My Journal Entries",
        portions: (await journalEntryModel.getTransactionPortionsForUser(req.authenticatedUser.id)),
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        prefill: {}
    })
}
async function journalEntrySearch(req, res){
    let fAccountId = parseInt(req.body.account_id)
    let fAccount = isNaN(fAccountId) ? null : await fAccountModel.getFAccountById(fAccountId);
    if(fAccount !== null && fAccount.owner !== req.authenticatedUser.id){
        await myJournalEntriesPage(req,res);
        return;
    }
    let start_date = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.exec(req.body.start_date)?.[0] ?? null;
    let end_date = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.exec(req.body.end_date)?.[0] ?? null;
    let portions = await journalEntryModel.searchTransactionPortions(req.authenticatedUser.id, fAccount?.id ?? null, start_date, end_date);
    res.render("journal-entries-list", {
        pageTitle: "Journal Entries" +
            (fAccount === null ? "" : " For '" + fAccount.nickname + "'") +
            (start_date === null ? "" : " After " + start_date) +
            (end_date === null ? "" : " Up To " + end_date),
        portions,
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        prefill: req.body ?? {},
        showTotals: true
    });
}
async function addJournalEntryPage(req,res){
    res.render('add-journal-entry', {
        prefill: req.body ?? {},
        rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) + 1 : 2,
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
    })
}
async function handleJournalEntryForm(req,res){
    if(typeof req.body.journal_entry_name !== "string" || req.body.journal_entry_name.length === 0){
        res.render('add-journal-entry', {
            error: "Error: Entry name is required",
            prefill: req.body,
            rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
            accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        });
        return;
    }
    if(typeof req.body.journal_entry_date !== "string" || /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.exec(req.body.journal_entry_date)?.length !== 1){
        res.render('add-journal-entry', {
            error: "Error: For-Date is required",
            prefill: req.body,
            rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
            accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
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
        if(typeof req.body[(req.mobile ? "m_" : "") + "description_" + i] !== "string"){
            res.status(400).send("Bad or missing description in row " + (i + 1));
            return;
        }
        portions[i].description = req.body[(req.mobile ? "m_" : "") + "description_" + i];
        if(typeof req.body[(req.mobile ? "m_" : "") + "account_id_" + i] !== "string" || isNaN((portions[i].account_id = parseInt(req.body[(req.mobile ? "m_" : "") + "account_id_" + i])))){
            res.render('add-journal-entry', {
                error: "Error: Missing account in row " + (i + 1),
                prefill: req.body,
                rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
            });
            return;
        }
        if(req.mobile){
            if(typeof req.body["d/c_" + i] !== "string" || (req.body["d/c_" + i] !== 'd' && req.body["d/c_" + i] !== 'c')){
                res.status(400).send("Missing debit/credit specifier in row " + (i + 1));
                return;
            }
            let amount = parseDollarValue(req.body["amount_" + i]);
            if(isNaN(amount)){
                res.render('add-journal-entry', {
                    error: "Error: Bad amount in row " + (i + 1),
                    prefill: req.body,
                    rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                    accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
                });
            }
            portions[i][req.body["d/c_" + i] === 'd' ? "debit" : "credit"] = amount;
        } else {
            if (typeof req.body["debit_" + i] !== "string" || (req.body["debit_" + i].length !== 0 && isNaN(portions[i].debit = parseDollarValue(req.body["debit_" + i])))) {
                res.render('add-journal-entry', {
                    error: "Error: Bad debit in row " + (i + 1),
                    prefill: req.body,
                    rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                    accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
                });
                return;
            }
            if (typeof req.body["credit_" + i] !== "string" || (req.body["credit_" + i].length !== 0 && isNaN(portions[i].credit = parseDollarValue(req.body["credit_" + i])))) {
                res.render('add-journal-entry', {
                    error: "Error: Bad credit in row " + (i + 1),
                    prefill: req.body,
                    rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                    accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
                });
                return;
            }
        }
        if((portions[i].credit === undefined) === (portions[i].debit === undefined)){
            res.render('add-journal-entry', {
                error: "Error: Row " + (i + 1) + " has " + ((portions[i].debit === undefined) ? "no" : "two") + " amount values",
                prefill: req.body,
                rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
            });
            return;
        }
        portions[i].amount = portions[i].credit === undefined ? portions[i].debit : -portions[i].credit;
    }
    if(portions.reduce((acc, x) => acc + x.amount, 0) !== 0){
        res.render('add-journal-entry', {
            error: "Error: Debit and credit totals are not equal",
            prefill: req.body,
            rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
            accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        });
        return;
    }
    if(await fAccountModel.getOwnerForAccounts(portions.map(x=>x.account_id)) !== req.authenticatedUser.id){
        res.render('add-journal-entry', {
            error: "Error: One or more accounts specified are invalid and/or deleted",
            prefill: req.body,
            rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
            accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        });
        return;
    }
    let journalEntryId = await journalEntryModel.createJournalEntry(req.body.journal_entry_name, req.body.journal_entry_date, typeof req.body.flagged === "string");
    await journalEntryModel.fillJournalEntry(journalEntryId, portions);
    res.redirect('/my-journal-entries');

}
async function updateStockPage(req, res){
    let stockAccountId = parseInt(req.params.account_id);
    if(isNaN(stockAccountId)){
        res.status(400).send("Non-numeric stock account id is invalid");
        return;
    }
    let stockAccount = await fAccountModel.getFAccountById(stockAccountId);
    if(!stockAccount){
        res.status(400).send("Stock account referenced does not exist");
        return;
    }
    if(stockAccount.owner !== req.authenticatedUser.id){
        res.status(400).send("Account owner is not logged in");
        return;
    }
    let accounts = await fAccountModel.getFAccountsForUser(req.authenticatedUser.id);
    let revenueCategory = fAccountType.findIndex(x=>x.name === "Revenue");
    let stockRevenueAccountId = accounts.find(x=>x.nickname === "Unrealized Stock Earnings" && x.category === revenueCategory)?.id;
    if(!stockRevenueAccountId){
        res.render('add-journal-entry', {
            error: "Error: Revenue account for Unrealized Stock Earnings is missing. Create a Revenue account with the name 'Unrealized Stock Earnings'\nto use the auto-update stock feature.",
            rowCount: 2,
            prefill: {
            },
            accounts
        });
        return;
    }
    let now = new Date();
    let yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    let dayBeforeYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() - 1)
    let url = "https://api.massive.com/v2/aggs/ticker/" + stockAccount.ticker + "/range/1/day/" + dayBeforeYesterday.getFullYear() + "-" + (dayBeforeYesterday.getMonth() + 1).toString().padStart(2, '0') + "-" + dayBeforeYesterday.getDate().toString().padStart(2, '0') + "/" + yesterday.getFullYear() + "-" + (yesterday.getMonth() + 1).toString().padStart(2, '0') + "-" + yesterday.getDate().toString().padStart(2, '0') + "?apiKey=" + process.env.MASSIVE_KEY
    let priceFetch = await fetch(url);
    if(priceFetch.status === 429){
        res.render('add-journal-entry', {
            rowCount: 2,
            prefill: {

            },
            error: "Please retry later. Massive's stock API free plan doesn't give out too many requests per minute :)",
            accounts
        })
        return;
    }
    let priceResults = await priceFetch.json();
    console.log(priceResults);
    res.render('add-journal-entry', {
        rowCount: 2,
        prefill: {
            "journal_entry_name": "Stock auto-update: " + stockAccount.ticker + " price → " + priceResults.results[0].c,
            "account_id_0": stockAccount.id.toString(),
            "account_id_1": stockRevenueAccountId.toString(),
            "debit_0": ((Math.round(priceResults.results[0].c * stockAccount.shares * 100) - stockAccount.balance) / 100).toString(),
            "credit_1": ((Math.round(priceResults.results[0].c * stockAccount.shares * 100) - stockAccount.balance) / 100).toString()
        },
        accounts
    })
}
export default {myJournalEntriesPage, addJournalEntryPage, handleJournalEntryForm, updateStockPage, journalEntrySearch}