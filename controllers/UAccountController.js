import accountModel from "../models/UAccount.js"

async function getAllAccounts(req, res){
    res.render('accounts-admin', {accounts: await accountModel.getAllAccounts()})
}
export default {getAllAccounts};