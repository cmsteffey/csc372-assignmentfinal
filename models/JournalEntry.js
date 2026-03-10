import pool from "./Pool.js"
import fAccountType from "./FAccountType.js";
async function getTransactionPortionsForUser(userId){
    return await searchTransactionPortions(userId, null, null, null, true);
}
async function searchTransactionPortions(userId, fAccountId, start_date, end_date, desc){
    let paramNum = 1;
    return (await pool.query(
        "SELECT journal_entry.*, journal_entry.id as entry_id, transaction_portion.id as id, financial_account.nickname as faccount_nickname, financial_account.category as faccount_category, transaction_portion.amount as amount, transaction_portion.description as description from journal_entry join transaction_portion on transaction_portion.journal_entry = journal_entry.id join financial_account on transaction_portion.financial_account = financial_account.id where financial_account.owner = $1" +
        (fAccountId !== null ? " AND financial_account.id = $" + ++paramNum : "") +
        (start_date !== null ? " AND journal_entry.for_date >= $" + ++paramNum : "") +
        (end_date !== null ? " AND journal_entry.for_date <= $" + ++paramNum : "") +
        " order by journal_entry.for_date " + (desc ? "DESC " : "") + "NULLS FIRST, transaction_portion.journal_entry, financial_account.category, financial_account.nickname", [userId, fAccountId,  start_date, end_date].filter(x=>x !== null)
    )).rows.map(x=>({...x, faccount_category_string: fAccountType[x.faccount_category].name}));
}
async function createJournalEntry(name, date, flagged){
    return (await pool.query(
        "INSERT INTO journal_entry (name, for_date, flagged) VALUES ($1, $2, $3) RETURNING id", [name, date, flagged])).rows[0].id
}
async function fillJournalEntry(journalEntryId, portions){
    return (await pool.query("INSERT INTO transaction_portion (journal_entry, financial_account, amount, description) VALUES " + portions.map((x, i) =>`($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4})`).join(','), portions.flatMap(x=>[journalEntryId, x.account_id, x.amount, x.description])))
}
export default {getTransactionPortionsForUser, createJournalEntry, fillJournalEntry, searchTransactionPortions}