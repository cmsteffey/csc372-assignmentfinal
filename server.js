import express from "express";
import uAccountRequestRouter from "./routers/UAccountRequestRouter.js";
import sessionRequestRouter from "./routers/SessionRouter.js";
import fAccountRouter from "./routers/FAccountRouter.js";
import journalEntryRouter from "./routers/JournalEntryRouter.js";
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
app.use(multerObj.none())
app.use("/static", express.static("static"));
app.use(authenticationMiddleware);
app.get("/", (req, res) => {
    res.render("index");
});
app.use("/", fAccountRouter);
app.use("/", uAccountRequestRouter);
app.use("/", sessionRequestRouter);
app.use("/", journalEntryRouter);
app.listen(listenDestination);
