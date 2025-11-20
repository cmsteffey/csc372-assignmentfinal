import pool from "../models/Pool.js";
import sessionModel from "../models/Session.js";
import uAccountModel from "../models/UAccount.js";
export default async function(req, res, next){
    let cookieHeader = req.headers.cookie;
    if(!cookieHeader){
        res.redirect('/login');
        return;
    }
    let sessionValue = cookieHeader.split(/;\s*/).filter(x=>x.startsWith('session='))[0]?.substring(8);
    if(!sessionValue || sessionValue.length !== 36){
        res.redirect('/login');
        return;
    }
    let account = await sessionModel.getAccountWithSessionUuid(sessionValue);
    if(account === null){
        res.redirect('/login');
        return;
    }
    res.locals.authenticatedUser = req.authenticatedUser = account;
    next();
}