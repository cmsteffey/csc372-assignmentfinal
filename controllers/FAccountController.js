import fAccountModel from "../models/FAccount.js"
import fAccountType from "../models/FAccountType.js";

async function myFAccountsPage(req,res){
    res.render('faccounts-list', {
        pageTitle: "My Accounts",
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        categoryTotals: await fAccountModel.getCategoryTotals(req.authenticatedUser.id),
        aleEquation: true
    });
}
async function addFAccountPage(req,res){
    res.render('add-faccount', {categories: fAccountType.map((x, i) => ({name: x, value: i}))});
}
async function handleAddFAccountForm(req, res){
    let categoryNumber;
    if(typeof req.body.category !== 'string' || isNaN(categoryNumber = parseInt(req.body.category)) || categoryNumber < 0 || categoryNumber > fAccountType.length){
        res.status(400).send("Category bad")
        return;
    }
    if(typeof req.body.nickname !== 'string'){
        res.status(400).send("Nickname bad")
        return;
    }
    await fAccountModel.addFAccount(req.authenticatedUser.id, categoryNumber, req.body.nickname.substring(0, 75));
    res.redirect('/my-accounts')

}

export default {myFAccountsPage, addFAccountPage, handleAddFAccountForm};