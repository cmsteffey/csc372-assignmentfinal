import pool from "./Pool.js";

async function addCreditCardInfo(account_id, cashback){
    return (await pool.query('INSERT INTO credit_card_info (financial_account, default_cashback_pct) VALUES ($1, $2)', [account_id, cashback])).rows;
}
export default {addCreditCardInfo};