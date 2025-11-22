import pool from './Pool.js'
import crypto from "node:crypto"
async function getAccountWithSessionUuid(uuid){
    let queryResult = await pool.query("SELECT user_account.* from session join user_account on user_account.id = session.user_id where key=$1::uuid", [uuid.toString()]);
    return queryResult.rows.length !== 1 ? null : queryResult.rows[0];
}
async function makeSession(accountId){
    const key = crypto.randomUUID()

    await pool.query("INSERT INTO session (user_id, key) VALUES ($1, $2::uuid)", [accountId, key.toString()]);
    return key;
}
async function deleteSession(uuid){
    await pool.query("DELETE FROM session where key=$1::uuid", [uuid]);
}
export default {makeSession, getAccountWithSessionUuid}