import express from "express";
import uAccountRequestRouter from "./routers/UAccountRequestRouter.js";
import sessionRequestRouter from "./routers/SessionRouter.js";
import fAccountRouter from "./routers/FAccountRouter.js";
import journalEntryRouter from "./routers/JournalEntryRouter.js";
import reportRouter from "./routers/ReportRouter.js";
import multer from "multer"
import {authenticationMiddleware} from "./middleware/Authentication.js";
import fs from "fs";
let app = express();
let listenDestination = 5656;
if(process.argv.length > 2 && (isNaN(listenDestination = parseInt(process.argv[2])))){
    try {
        let s = fs.statSync(process.argv[2]);
        if(!s.isSocket()){
            console.error("Specified listen destination is a non-socket file");
            process.exit(1);
        }
        fs.unlinkSync(process.argv[2]);
    } catch (e) {
        if(e.code !== "ENOENT"){
            console.error("Issue with statting target destiation: " + e.code);
            process.exit(1);
        }
    }
}
if(!isNaN(listenDestination) && (listenDestination < 1024 || listenDestination > 65535 || Math.floor(listenDestination) != listenDestination)){
    console.error("Port out of range");
    process.exit(1);
}
if(isNaN(listenDestination)){
    listenDestination = process.argv[2];
}
let multerObj = multer({});
app.set("view engine", "ejs");
app.set("views", import.meta.dirname + "/templates");
app.use("/static", express.static("static"));
app.use((req, res, next) => {
    if(req.url.startsWith("/spa?") && req.query.realpath){
        req.url = req.query.realpath;
    } else if (req.url.startsWith("/spaform/")) {
        req.url = req.url.substring(8);
    } else {
        next();
        return;
    }
    let oldSend = res.send.bind(res);
    res.send = (body) => {
        if(body.toLowerCase().startsWith("<!doctype html>")){
            body = body.replace(/<a (?<before>[^>]*)href="\/(?<path>[^"?]*)(\?(?<query>[^"]*))?"(?<after>[^>]*)>/g, "<a $<before>href=\"/spa?realpath=/$<path>&$<query>\" $<after>>");
            body = body.replace(/<form (?<before>[^>]*)action="\/(?<path>[^"]*)"(?<after>[^>]*)>/g, "<form $<before>action=\"/spaform/$<path>\" $<after>>");
            body = body.replace(/<button (?<before>[^>]*)formaction="\/(?<path>[^"]*)"(?<after>[^>]*)>/g, "<button $<before>formaction=\"/spaform/$<path>\" $<after>>");
        }
        oldSend(body);
    }
    let oldRedirect = res.redirect.bind(res);
    res.redirect = (p1, p2) => {
        if(typeof p1 == "number"){
            oldRedirect(p1, "/spa?realpath=" + p2);
        }
        oldRedirect("/spa?realpath=" + p1);
    }
    req.app.handle(req, res, next);
})
app.use(multerObj.none())
app.use(authenticationMiddleware);
app.get("/", (req, res) => {
    res.render("index");
});
app.use("/", fAccountRouter);
app.use("/", uAccountRequestRouter);
app.use("/", sessionRequestRouter);
app.use("/", journalEntryRouter);
app.use("/", reportRouter);
app.listen(listenDestination);
