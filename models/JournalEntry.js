import pool from "./Pool.js"
import fAccountType from "./FAccountType.js";
async function getTransactionPortionsForUser(userId){
    return await searchTransactionPortions({
        userId,
        desc: true
    })
}
/*
    Options:
    {
      userId: Number,
      fAccountId: Number,
      start_date: String (YYYY-MM-DD),
      end_date: String (YYYY-MM-DD),
      journal_entry_id: Number,
      desc: boolean,
      categories: Array[Number]
    }
 */
async function searchTransactionPortions(options){
    let paramNum = 0;
    return (await pool.query(
        "SELECT journal_entry.*, financial_account.nickname as faccount_nickname, financial_account.short_name as faccount_short_name, financial_account.category as faccount_category, financial_account.id as faccount_id, transaction_portion.amount as amount, transaction_portion.description as description, transaction_portion.journal_entry as entry_id, transaction_portion.id as id from journal_entry join transaction_portion on transaction_portion.journal_entry = journal_entry.id join financial_account on transaction_portion.financial_account = financial_account.id where TRUE" +
        (options.userId !== undefined ? " AND financial_account.owner = $" + ++paramNum : "") +
        (options.fAccountId !== undefined ? " AND financial_account.id = $" + ++paramNum : "") +
        (options.start_date !== undefined ? " AND journal_entry.for_date >= $" + ++paramNum : "") +
        (options.end_date !== undefined ? " AND journal_entry.for_date <= $" + ++paramNum : "") +
        (options.journal_entry_id !== undefined ? " AND journal_entry.id = $" + ++paramNum : "") +
        (options.categories !== undefined ? " AND financial_account.category IN (" + [...Array(options.categories.length).keys()].map(_=>"$" + ++paramNum).join(",") + ")": "") +
        " order by journal_entry.for_date " + (options.desc ? "DESC " : "") + "NULLS FIRST, transaction_portion.journal_entry, financial_account.category, financial_account.nickname", [options.userId, options.fAccountId,  options.start_date, options.end_date, options.journal_entry_id, ...(options.categories ?? [])].filter(x=>x !== undefined)
    )).rows.map(x=>({...x, faccount_category_string: fAccountType[x.faccount_category].name}));
}
async function getPayablesForUser(userId){
    return (await pool.query(
        "select description as name, SUM(amount)::integer as amount from transaction_portion join financial_account on financial_account.id = transaction_portion.financial_account where financial_account.nickname = 'Accounts Payable' and financial_account.owner = $1 group by description"
        , [userId])).rows
}
async function getReceivablesForUser(userId){
    return (await pool.query(
        "select description as name, SUM(amount)::integer as amount from transaction_portion join financial_account on financial_account.id = transaction_portion.financial_account where financial_account.nickname = 'Accounts Receivable' and financial_account.owner = $1 group by description"
        , [userId])).rows
}
async function createJournalEntry(name, date, flagged){
    return (await pool.query(
        "INSERT INTO journal_entry (name, for_date, flagged) VALUES ($1, $2, $3) RETURNING id", [name, date, flagged])).rows[0].id
}
async function fillJournalEntry(journalEntryId, portions){
    return (await pool.query("INSERT INTO transaction_portion (journal_entry, financial_account, amount, description) VALUES " + portions.map((x, i) =>`($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4})`).join(','), portions.flatMap(x=>[journalEntryId, x.account_id, x.amount, x.description])))
}
async function deleteJournalEntry(journalEntryId){
    return (await pool.query("DELETE FROM journal_entry WHERE id = $1", [journalEntryId]));
}
export default {getTransactionPortionsForUser, createJournalEntry, fillJournalEntry, searchTransactionPortions, deleteJournalEntry, getPayablesForUser, getReceivablesForUser}