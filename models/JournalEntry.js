import pool from "./Pool.js"
async function getTransactionPortionsForUser(userId){
    return (await pool.query(
        "SELECT journal_entry.*, financial_account.nickname as faccount_nickname, financial_account.category as faccount_category, transaction_portion.amount as amount, financial_account.id as faccount_id from journal_entry join transaction_portion on transaction_portion.journal_entry = journal_entry.id join financial_account on transaction_portion.financial_account = financial_account.id where financial_account.owner = $1", [userId])).rows;
}
async function createJournalEntry(name){
    return (await pool.query(
        "INSERT INTO journal_entry (name) VALUES ($1) RETURNING id", [name])).rows[0].id
}
async function fillJournalEntry(journalEntryId, portions){
    return (await pool.query("INSERT INTO transaction_portion (journal_entry, financial_account, amount) VALUES " + portions.map((x, i) =>`($${i*3+1}, $${i*3+2}, $${i*3+3})`).join(','), portions.flatMap(x=>[journalEntryId, x.account_id, x.amount])));
}
export default {getTransactionPortionsForUser, createJournalEntry, fillJournalEntry}