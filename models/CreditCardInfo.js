import pool from "./Pool.js";

async function addCreditCardInfo(account_id, cashback, cb_account_id){
    return (await pool.query('INSERT INTO credit_card_info (financial_account, default_cashback_pct, default_cashback_account) VALUES ($1, $2, $3) ON CONFLICT (financial_account) DO UPDATE SET default_cashback_pct = EXCLUDED.default_cashback_pct, default_cashback_account = EXCLUDED.default_cashback_account', [account_id, cashback, cb_account_id])).rows;
}
export default {addCreditCardInfo};
