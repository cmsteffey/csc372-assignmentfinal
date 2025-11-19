import pool from "./Pool.js"
import fAccountType from "./fAccountType.js"
export async function getAllFAccounts() {
    return (await pool.query("SELECT * FROM financial_accounts")).rows.map(loadCategoryString)
}
export async function getFAccountsForUser(userId){
    return (await pool.query("SELECT * FROM financial_accounts where owner = $1", [userId])).rows
}
function loadCategoryString(row){
    return {
        ...row,
        categoryString: fAccountType[row.category] + row.category
    }
}