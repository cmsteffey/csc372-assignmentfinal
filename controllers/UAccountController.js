import accountModel from "../models/UAccount.js"
import sessionModel from "../models/Session.js"
import crypto from "node:crypto"
import argonConfiguration from "../configurations/ArgonConfiguration.js";
async function registrationPage(req, res) {
    res.render('register');
}
async function allUserAccounts(req, res){
    res.render('uaccounts-admin', {accounts: await accountModel.getAllAccounts()})
}
async function me(req, res){
    res.render('me');
}
async function registerAccount(req, res){
    if(!req.body.username || typeof req.body.username !== "string"){
        res.status(400).send("Username required");
        return;
    }
    if(!req.body.password || typeof req.body.password !== "string"){
        res.status(400).send("Password required");
        return;
    }
    if(!req.body.email || typeof req.body.email !== "string"){
        res.status(400).send("Email required");
        return;
    }
    let salt = crypto.randomBytes(16);
    let hashPromise = new Promise((resolve, reject) => {
        crypto.argon2("argon2id", {
            message: req.body.password,
            nonce: salt,
            ...argonConfiguration
        }, (err, result) => {
            if(err !== null){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
    let partialAccount = await accountModel.createAccount(req.body.username, salt.toString("hex"), (await hashPromise).toString("hex"), req.body.email);
    let sessionKey = await sessionModel.makeSession(partialAccount.id);
    res.header("Set-Cookie", "session=" + sessionKey);
    res.redirect("/me");
}
export default {allUserAccounts, me, registerAccount, registrationPage};