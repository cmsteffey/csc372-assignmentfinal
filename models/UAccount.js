import pool from "./Pool.js"

async function getAllAccounts(){
    return (await pool.query("SELECT * from user_account")).rows;
}
async function getAccountAuthenticationData(username){
    let rows = (await pool.query("SELECT passhash, salt, id FROM user_account where username = $1", [username.toString()])).rows;
    return rows.length !== 1 ? null : rows[0];
}
async function createAccount(username, salt, passhash, email){
    return (await pool.query("INSERT INTO user_account (username, salt, passhash, email) VALUES ($1, $2, $3, $4) RETURNING id", [
        username, salt, passhash, email
    ])).rows[0];
}

export default {getAllAccounts, getAccountAuthenticationData, createAccount};