import express from "express";
import uAccountRequestRouter from "./routers/UAccountRequestRouter.js";
import sessionRequestRouter from "./routers/SessionRouter.js";
import multer from "multer"

console.log(import.meta.dirname)
let app = express();

let multerObj = multer({});
app.set("view engine", "ejs");
app.set("views", import.meta.dirname + "/templates");
app.use(multerObj.none())
app.use("/static", express.static("static"));
app.use("/", uAccountRequestRouter);
app.use("/", sessionRequestRouter);
app.listen(5656)