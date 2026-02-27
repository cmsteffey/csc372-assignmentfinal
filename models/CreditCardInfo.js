import pool from "./Pool.js";

async function addCreditCardInfo(account_id, cashback, cb_account_id){
    return (await pool.query('INSERT INTO credit_card_info (financial_account, default_cashback_pct, default_cashback_account) VALUES ($1, $2, $3)', [account_id, cashback, cb_account_id])).rows;
}
export default {addCreditCardInfo};
