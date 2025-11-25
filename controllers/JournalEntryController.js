import journalEntryModel from "../models/JournalEntry.js"
import fAccount from "../models/FAccount.js";
import fAccountType from "../models/FAccountType.js"
async function myJournalEntriesPage(req,res){
    res.render('journal-entries-list', {
        pageTitle: "My Journal Entries",
        portions: (await journalEntryModel.getTransactionPortionsForUser(req.authenticatedUser.id))
    })
}
async function addJournalEntryPage(req,res){
    res.render('add-journal-entry', {
        prefill: req.body ?? {},
        rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) + 1 : 2,
        accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
    })
}
async function handleJournalEntryForm(req,res){
    if(typeof req.body.journal_entry_name !== "string" || req.body.journal_entry_name.length === 0){
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
        if(typeof req.body["debit_" + i] !== "string" || (req.body["debit_" + i].length !== 0 && isNaN(portions[i].debit = parseDollarValue(req.body["debit_" + i])))){
            res.render('add-journal-entry', {
                error: "Error: Bad debit in row " + (i + 1),
                prefill: req.body,
                rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
            });
            return;
        }
        if(typeof req.body["credit_" + i] !== "string" || (req.body["credit_" + i].length !== 0 && isNaN(portions[i].credit = parseDollarValue(req.body["credit_" + i])))){
            res.render('add-journal-entry', {
                error: "Error: Bad credit in row " + (i + 1),
                prefill: req.body,
                rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
            });
            return;
        }
        if((portions[i].credit === undefined) === (portions[i].debit === undefined)){
            res.render('add-journal-entry', {
                error: "Error: Row " + (i + 1) + " has " + ((portions[i].debit === undefined) ? "no" : "two") + " amount values",
                prefill: req.body,
                rowCount: ("body" in req && "rowCount" in req.body) ? (parseInt(req.body.rowCount) || 2) : 2,
                accounts: await fAccount.getFAccountsForUser(req.authenticatedUser.id),
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
    let journalEntryId = await journalEntryModel.createJournalEntry(req.body.journal_entry_name);
    await journalEntryModel.fillJournalEntry(journalEntryId, portions);
    res.redirect('/my-journal-entries');

}
async function updateStockPage(req, res){
    let stockAccountId = parseInt(req.params.account_id);
    if(isNaN(stockAccountId)){
        res.status(400).send("Non-numeric stock account id is invalid");
        return;
    }
    let stockAccount = await fAccount.getFAccountById(stockAccountId);
    if(!stockAccount){
        res.status(400).send("Stock account referenced does not exist");
        return;
    }
    if(stockAccount.owner !== req.authenticatedUser.id){
        res.status(400).send("Account owner is not logged in");
        return;
    }
    let accounts = await fAccount.getFAccountsForUser(req.authenticatedUser.id);
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
    let url = "https://api.massive.com/v2/aggs/ticker/" + stockAccount.ticker + "/range/1/day/" + dayBeforeYesterday.getFullYear() + "-" + (dayBeforeYesterday.getMonth() + 1) + "-" + dayBeforeYesterday.getDate() + "/" + yesterday.getFullYear() + "-" + (yesterday.getMonth() + 1) + "-" + yesterday.getDate() + "?apiKey=" + process.env.MASSIVE_KEY

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

    res.render('add-journal-entry', {
        rowCount: 2,
        prefill: {
            "name": "Stock auto-update: " + stockAccount.ticker + " price → " + priceResults.results[0].c,
            "account_id_0": stockAccount.id.toString(),
            "account_id_1": stockRevenueAccountId.toString(),
            "debit_0": (Math.round(priceResults.results[0].c * stockAccount.shares * 100) - stockAccount.balance).toString(),
            "credit_1": (Math.round(priceResults.results[0].c * stockAccount.shares * 100) - stockAccount.balance).toString()
        },
        accounts
    })
}
function parseDollarValue(string){
    if(string.length === 0) return NaN;
    let multiplier;
    if(string[0] === '-'){
        multiplier = -1;
        string = string.substring(1);
    } else {
        multiplier = 1;
    }
    let periodIndex = string.indexOf('.');
    if(periodIndex === -1){
        multiplier *= 100;
    } else if (periodIndex === string.length - 2){
        multiplier *= 10;
    } else if (periodIndex !== string.length - 3){
        return NaN;
    }
    let charArray = Array.from(string);
    let value = 0;
    for(let i = 0; i < charArray.length; i++) {
        if (i === periodIndex)
            continue;
        let charCode = charArray[i].charCodeAt(0)
        if(charCode < 48 || charCode > 57){
            return NaN;
        }
        value *= 10;
        value += charArray[i].charCodeAt(0) - 48;
    }
    return value * multiplier;
}
export default {myJournalEntriesPage, addJournalEntryPage, handleJournalEntryForm, updateStockPage}