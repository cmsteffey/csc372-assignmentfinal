import express from "express";
import uAccountRequestRouter from "./routers/UAccountRequestRouter.js";
import sessionRequestRouter from "./routers/SessionRouter.js";
import fAccountRouter from "./routers/FAccountRouter.js";
import journalEntryRouter from "./routers/JournalEntryRouter.js";
import multer from "multer"
import {authenticationMiddleware} from "./middleware/Authentication.js";

console.log(import.meta.dirname)
let app = express();

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
app.listen(5656)