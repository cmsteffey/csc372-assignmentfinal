import sessionModel from "../models/Session.js";
export async function authenticationMiddleware(req, res, next){
    let cookieHeader = req.headers.cookie;
    if(!cookieHeader){
        res.locals.authenticatedUser = req.authenticatedUser = null;
        next();
        return;
    }
    let sessionValue = cookieHeader.split(/;\s*/).filter(x=>x.startsWith('session='))[0]?.substring(8);
    if(!sessionValue || sessionValue.length !== 36){
        res.locals.authenticatedUser = req.authenticatedUser = null;
        next();
        return;
    }
    let account = await sessionModel.getAccountWithSessionUuid(sessionValue);
    if(account === null){
        res.locals.authenticatedUser = req.authenticatedUser = null;
        next();
        return;
    }
    res.locals.authenticatedUser = req.authenticatedUser = account;
    next();
}
export async function authenticationBarrier(req, res, next){
    if(req.authenticatedUser !== null){
        next();
        return;
    }
    if(req.method === "POST"){
        res.redirect("/login")
        return;
    }
    res.header("Set-Cookie", "redir=" + req.path + "; HttpOnly")
    res.redirect("/login");
}