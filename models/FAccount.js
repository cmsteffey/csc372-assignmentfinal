import pool from "./Pool.js"
import fAccountType from "./fAccountType.js"
/*async function getAllFAccounts() {
    return (await pool.query("SELECT * FROM financial_account order by owner, category, LOWER(nickname)")).rows.map(loadCategoryString)
}*/
async function getFAccountsForUser(userId){
    return (await pool.query(
        "SELECT financial_account.*, COALESCE(SUM(transaction_portion.amount), 0) as balance FROM financial_account left join transaction_portion on transaction_portion.financial_account = financial_account.id where financial_account.owner = $1 group by financial_account.id order by category, LOWER(nickname)"
        , [userId])).rows.map(loadCategoryString)
}
async function getCategoryTotals(userId){
    //Query returns [{category: number, total: number}], so beginning portion is filling in default 0s to be overwritten by results
    return [...Array(fAccountType.length).keys()].map(x=>({category: x, total: 0})).concat((await pool.query("SELECT financial_account.category, SUM(transaction_portion.amount) as total from transaction_portion join financial_account on transaction_portion.financial_account = financial_account.id where financial_account.owner = $1 group by financial_account.category ", [userId])).rows).reduce((acc, x)=>({...acc, [fAccountType[x.category].name.toLowerCase()]: x.total}), {})
}
async function addFAccount(userId, category, nickname){
    return (await pool.query("INSERT INTO financial_account (owner, category, nickname) VALUES ($1, $2, $3) RETURNING id", [userId, category, nickname])).rows[0].id;
}
function loadCategoryString(row){
    return {
        ...row,
        categoryString: fAccountType[row.category].name
    }
}
export default {getFAccountsForUser, addFAccount, getCategoryTotals};