import sessionModel from '../models/Session.js';
import uAccountModel from '../models/UAccount.js';
import crypto from "node:crypto"
import argonConfiguration from "../configurations/ArgonConfiguration.js";

function loginPage(req, res){
    res.render('login');``
}
async function logout(req, res){
    res.header("Set-Cookie", "session=");
    res.redirect("/");
}
async function handleLoginForm(req, res){
    if(!req.body.username || typeof req.body.username !== 'string'){
        res.status(400).send('Username required');
        return;
    }
    if(!req.body.password ||  typeof req.body.password !== 'string'){
        res.status(400).send('Password required');
        return;
    }
    let partialAccount = await uAccountModel.getAccountAuthenticationData(req.body.username);
    if(!partialAccount) {
        res.redirect("/login?e");
        return;
    }
    let inputPasswordHash = await new Promise((resolve, reject) => {
        crypto.argon2("argon2id", {
            ...argonConfiguration,
            message: req.body.password,
            nonce: Buffer.from(partialAccount.salt, "hex")
        }, (error, result) => {
            if(error){
                reject(error);
            } else {
                resolve(result)
            }
        })
    });
    if(inputPasswordHash.toString("hex") !== partialAccount.passhash){
        res.redirect("/login?e");
        return;
    }
    let key = await sessionModel.makeSession(partialAccount.id);
    res.header("Set-Cookie", "session=" + key);
    res.redirect("/my-accounts");
}
export default {handleLoginForm, loginPage, logout};