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
async function editJournalEntryPage(req,res){
    if(isNaN(parseInt(req.params.id))){
        return res.redirect("/my-journal-entries");
    }
    let portions = await journalEntryModel.searchTransactionPortions(req.authenticatedUser.id, null, null, null, req.params.id);
    if(portions.length === 0){
        return res.redirect("/my-journal-entries");
    }
    let prefill = {}
    for(let i = 0; i < portions.length; ++i){
        prefill["d/c_" + i] = portions[i].amount < 0 ? "c" : "d";
        prefill["amount_" + i] = prefill[(portions[i].amount < 0 ? "credit" : "debit") + "_" + i] = Math.abs(portions[i].amount).toString().slice(0, -2) + "." + Math.abs(portions[i].amount).toString().padStart(2, '0').slice(-2);
        prefill["m_description_" + i] = prefill["description_" + i] = portions[i].description;
        prefill["m_account_id_" + i] = prefill["account_id_" + i] = portions[i].faccount_id.toString();
    }
    prefill["journal_entry_name"] = portions[0].name;
    prefill["flagged"] = portions[0].flagged ? "" : undefined;
    prefill["journal_entry_date"] = portions[0].for_date;
    prefill["replace_entry_id"] = req.params.id;
    prefill["page_title"] = "Edit '" + portions[0].name + "'"
    res.render('add-journal-entry', {
        rowCount: portions.length,
        prefill,
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
    let dcDifference = portions.reduce((acc, x) => acc + x.amount, 0);
    if(dcDifference !== 0){
        res.render('add-journal-entry', {
            error: "Error: Debit and credit totals are not equal. Debits - Credits = " + (dcDifference < 0 ? '-' : '') + Math.abs(Math.trunc(dcDifference / 100)) + "." + Math.abs(dcDifference % 100).toString().padStart(2, '0'),
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
    let replacedJournalEntryId = parseInt(req.body.replace_entry_id);
    if(!isNaN(replacedJournalEntryId)){
        if(await fAccountModel.getOwnerForAccounts((await journalEntryModel.searchTransactionPortions(null, null, null, null, replacedJournalEntryId)).map(x=>x.faccount_id)) === req.authenticatedUser.id){
            await journalEntryModel.deleteJournalEntry(replacedJournalEntryId);
        } else {
            res.render('add-journal-entry', {
                error: "Error: You are trying to edit a deleted journal entry",
                prefill: req.body,
                rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
            });
            return;
        }
    }
    let journalEntryId = await journalEntryModel.createJournalEntry(req.body.journal_entry_name, req.body.journal_entry_date, typeof req.body.flagged === "string");
    await journalEntryModel.fillJournalEntry(journalEntryId, portions);
    res.redirect('/my-journal-entries');

}
async function handleDeleteEntryForm(req, res){
    let entryId;
    if(isNaN((entryId = parseInt(req.params.id)))){
        res.status(400).send("Non-numeric entry id");
        return;
    }
    if(await fAccountModel.getOwnerForAccounts((await journalEntryModel.searchTransactionPortions(null, null, null, null, entryId)).map(x=>x.faccount_id)) === req.authenticatedUser.id){
        await journalEntryModel.deleteJournalEntry(replacedJournalEntryId);
        res.redirect("my-journal-entries");
        return;
    } else {
        res.status(400).send("You are trying to delete a deleted journal entry");
        return;
    }
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
async function quickChargePage(req, res){
    let accountIdString = req.params.id;
    let accountId;
    if(!accountIdString || isNaN((accountId = parseInt(accountIdString)))){
        res.redirect("/my-accounts");
        return;
    }
    let account = await fAccountModel.getFAccountById(accountId);
    if(!account || account.default_cashback_pct === null || account.owner !== req.authenticatedUser.id) {
        res.redirect(303, '/my-accounts');
        return;
    }
    res.render('quick-charge', {
        ccAccount: account,
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id)
    });
}
async function handleQuickChargeForm(req, res){
    let accounts = await fAccountModel.getFAccountsForUser(req.authenticatedUser.id);
    let ccAccountIdString = req.params.id;
    let ccAccountId;
    if(!ccAccountIdString || isNaN((ccAccountId = parseInt(ccAccountIdString)))){
        res.redirect(303, '/my-accounts');
        return;
    }
    let ccAccount = await fAccountModel.getFAccountById(ccAccountId);
    if(!ccAccount || ccAccount.default_cashback_pct === null || ccAccount.owner !== req.authenticatedUser.id) {
        res.redirect(303, '/my-accounts');
        return;
    }
    let cashbackAccount = req.body?.cb_account_id
    if(!cashbackAccount){
        res.render('quick-charge', {
            ccAccount,
            accounts,
            prefill: req.body ?? {},
            error: "No cashback account selected",
        })
        return;
    }
    let expenseAccountIdString = req.body?.expense_account_id;
    let expenseAccountId;
    if(!expenseAccountIdString || isNaN((expenseAccountId = parseInt(expenseAccountIdString)))){
        res.render('quick-charge', {
            ccAccount,
            accounts,
            prefill: req.body ?? {},
            error: "Expense account not selected"
        })
        return;
    }
    let expenseAccount = await fAccountModel.getFAccountById(expenseAccountId);
    if(!expenseAccount || expenseAccount.categoryString !== "Expense" || expenseAccount.owner !== req.authenticatedUser.id) {
        res.render('quick-charge', {
            ccAccount,
            accounts,
            prefill: req.body ?? {},
            error: "Non-existent expense account selected"
        })
        return;
    }

    let cashbackPct = parseDollarValue(req.body.cashback);
    if(isNaN(cashbackPct)){
        res.render('quick-charge', {
            ccAccount,
            accounts,
            prefill: req.body ?? {},
            error: "Mis-entered cashback pct"
        })
        return;
    }
    let chargeAmtString = req.body?.charge_amt;
    let chargeAmt;
    if(isNaN(chargeAmt = parseDollarValue(chargeAmtString))){
        res.render('quick-charge', {
            ccAccount,
            accounts,
            prefill: req.body ?? {},
            error: "Mis-entered charge_amt"
        })
        return;
    }
    let cashbackAmt = cashbackPct * chargeAmt;
    console.log(cashbackAmt);
    cashbackAmt = Math.floor(cashbackAmt / 10000) + (cashbackAmt % 10000 >= 5000 ? 1 : 0);
    console.log(cashbackAmt);
    res.render('add-journal-entry', {
        prefill: {
            "journal_entry_name": "QC",
            "account_id_0": expenseAccountId.toString(),
            "account_id_1": ccAccountId.toString(),
            "account_id_2": cashbackAccount.toString(),
            "debit_0": Math.floor((chargeAmt - cashbackAmt)/100).toString() + "." + ((chargeAmt - cashbackAmt)%100).toString().padStart(2, '0'),
            "credit_1": Math.floor((chargeAmt)/100).toString() + "." + ((chargeAmt)%100).toString().padStart(2, '0'),
            "debit_2": Math.floor((cashbackAmt)/100).toString() + "." + ((cashbackAmt)%100).toString().padStart(2, '0'),
            "description_2": Math.floor(cashbackPct / 100).toString() + "%",

            "m_account_id_0": expenseAccountId.toString(),
            "m_account_id_1": ccAccountId.toString(),
            "m_account_id_2": cashbackAccount.toString(),
            "amount_0": Math.floor((chargeAmt - cashbackAmt)/100).toString() + "." + ((chargeAmt - cashbackAmt)%100).toString().padStart(2, '0'),
            "amount_1": Math.floor((chargeAmt)/100).toString() + "." + ((chargeAmt)%100).toString().padStart(2, '0'),
            "amount_2": Math.floor((cashbackAmt)/100).toString() + "." + ((cashbackAmt)%100).toString().padStart(2, '0'),
            "d/c_0": "d",
            "d/c_1": "c",
            "d/c_2": "d",
            "m_description_2": Math.floor(cashbackPct / 100).toString() + "%",
        },
        accounts,
        "rowCount": 3
    })
}
export default {myJournalEntriesPage, addJournalEntryPage, handleJournalEntryForm, updateStockPage, journalEntrySearch, quickChargePage, handleQuickChargeForm, editJournalEntryPage, handleDeleteEntryForm}
