import fAccountModel from "../models/FAccount.js"
import fAccountType from "../models/FAccountType.js";
import creditCardInfo from "../models/CreditCardInfo.js";
import {parseDollarValue} from "../common/functions.js";

async function myFAccountsPage(req,res){
    res.render('faccounts-list', {
        pageTitle: "My Accounts",
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        categoryTotals: await fAccountModel.getCategoryTotals(req.authenticatedUser.id),
        aleEquation: true
    });
}
async function addFAccountPage(req,res){
    res.render('add-faccount', {categories: fAccountType.map((x, i) => ({name: x.name, value: i}))});
}
async function registerCcPage(req,res){
    res.render('register-cc', {
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        selected: null
    });
}
async function handleRegisterCcForm(req,res){
    let fAccount = isNaN(req.body.faccount_id) ? null : await fAccountModel.getFAccountById(req.body.faccount_id);
    if(fAccount === null || fAccount.owner !== req.authenticatedUser.id || fAccount.category !== fAccountType.findIndex(x=>x.name === "Liability")){
        await registerCcPage(req,res);
        return;
    }
    let cashbackPercent = parseDollarValue(req.body.cashback);
    console.log(cashbackPercent);
    if (isNaN(cashbackPercent)){
        await registerCcPage(req,res);
        return;
    }
    await creditCardInfo.addCreditCardInfo(fAccount.id, cashbackPercent);
    res.redirect('/my-accounts')
}
async function addStockFAccountPage(req,res){
    res.render('add-stock-faccount');
}
async function handleAddStockFAccountForm(req,res){
    if(typeof req.body.ticker !== 'string' || req.body.ticker.length === 0){
        res.render('add-stock-faccount', {
            error: "Ticker missing",
            prefill: req.body
        });
        return;
    }
    let starting_shares;
    if(typeof req.body.starting_shares !== 'string' || isNaN(starting_shares = parseInt(req.body.starting_shares))){
        res.render('add-stock-faccount', {
            error: "Starting share count missing",
            prefill: req.body
        });
    }
    await fAccountModel.addStockFAccount(req.authenticatedUser.id, req.body.ticker, starting_shares);
    res.redirect("/my-accounts");
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


export default {myFAccountsPage, addFAccountPage, handleAddFAccountForm, addStockFAccountPage, handleAddStockFAccountForm, registerCcPage, handleRegisterCcForm};