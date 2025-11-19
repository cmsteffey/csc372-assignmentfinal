import pool from "./Pool.js"

async function getAllAccounts(){
    return (await pool.query("SELECT * from user_account")).rows;
}

export default {getAllAccounts};