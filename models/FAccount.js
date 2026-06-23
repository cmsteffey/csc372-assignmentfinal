import pool from "./Pool.js"
import fAccountType from "./FAccountType.js"
/*async function getAllFAccounts() {
    return (await pool.query("SELECT * FROM financial_account order by owner, category, LOWER(nickname)")).rows.map(loadCategoryString)
}*/
async function getFAccountsForUser(userId){
    return await getFAccounts({userId});
}
async function getFAccountById(accountId){
    return (await getFAccounts({accountId}))[0]
}
async function getFAccounts(options){
    options ??= {};
    let fields = []
    if(options.accountId)
        fields.push(options.accountId);
    if(options.userId)
        fields.push(options.userId);
    return (await pool.query(
        "SELECT financial_account.*, ANY_VALUE(credit_card_info.default_cashback_pct) as default_cashback_pct, ANY_VALUE(credit_card_info.default_cashback_account) as default_cashback_account, ANY_VALUE(stock_financial_account.shares) as shares, ANY_VALUE(stock_financial_account.ticker) as ticker, COALESCE(SUM(transaction_portion.amount), 0)::integer as balance FROM financial_account left join stock_financial_account on stock_financial_account.financial_account = financial_account.id left join transaction_portion on transaction_portion.financial_account = financial_account.id left join credit_card_info on financial_account.id = credit_card_info.financial_account " + (options.userId ? "WHERE owner = $1 " : "") + (options.accountId ? "WHERE financial_account.id = " + (options.userId ? "$2 " : "$1 "): "") + "group by financial_account.id order by category, LOWER(nickname)"
        , fields)).rows.map(x=>({...x, balance: fAccountType[x.category].debitIncrease ? x.balance : -x.balance})).map(loadCategoryString)
}
async function getFAccountSkeletons(options){
    options ??= {};
    if(options.accountId)
        fields.push(options.accountId);
    if(options.userId)
        fields.push(options.userId);
    let fieldNum = 0;
    return (await pool.query(
        "SELECT * from financial_account where TRUE" +
        (options.accountId ? " AND financial_account.id = $" + ++fieldNum : "") +
        (options.userId ? " AND financial_account.owner = $" + ++fieldNum : "") +
        " order by financial_account.category, LOWER(financial_account.nickname)"
    )).rows
}
async function getCategoryTotals(userId){
    //Query returns [{category: number, total: number}], so beginning portion is filling in default 0s to be overwritten by results
    return [...Array(fAccountType.length).keys()].map(x=>({category: x, total: 0})).concat((await pool.query("SELECT financial_account.category, SUM(transaction_portion.amount)::integer as total from transaction_portion join financial_account on transaction_portion.financial_account = financial_account.id where financial_account.owner = $1 group by financial_account.category ", [userId])).rows).reduce((acc, x)=>({...acc, [fAccountType[x.category].name.toLowerCase()]: fAccountType[x.category].debitIncrease ? x.total : -x.total}), {})
}
async function addFAccount(userId, category, nickname, shortname){
    return (await pool.query("INSERT INTO financial_account (owner, category, nickname, short_name) VALUES ($1, $2, $3, $4) RETURNING id", [userId, category, nickname, shortname ?? null])).rows[0].id;
}
async function addStockFAccount(userId, ticker, starting_shares){
    let createdFAccountId = (await pool.query("INSERT INTO financial_account (owner, category, nickname) VALUES ($1, $2, $3) RETURNING id", [userId, fAccountType.findIndex(x=>x.name === "Asset"), "STOCK: " + ticker])).rows[0].id;
    (await pool.query("INSERT INTO stock_financial_account (financial_account, ticker, shares) VALUES ($1, $2, $3)", [createdFAccountId, ticker, starting_shares]));
    return createdFAccountId;
}
function loadCategoryString(row){
    return {
        ...row,
        categoryString: fAccountType[row.category].name
    }
}
async function getOwnerForAccounts(accounts){
    if(accounts.length === 0){
        return null;
    }
    let rows = (await pool.query("WITH query_accounts AS (SELECT UNNEST(ARRAY[" + Array.from(accounts.keys()).map(x=>"$" + (x + 1) + "::integer").join(',') + "]) as account_id) SELECT financial_account.owner FROM query_accounts LEFT JOIN financial_account on query_accounts.account_id = financial_account.id", accounts)).rows;
    return rows.every((x, i, a) => x.owner === a[0].owner) && rows.length === accounts.length ? rows[0].owner : null;
}
export default {getFAccountsForUser, addFAccount, getCategoryTotals, getOwnerForAccounts, getFAccountById, addStockFAccount, getFAccountSkeletons};
