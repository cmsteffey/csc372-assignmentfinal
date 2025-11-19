import express from "express";
import accountRequestRouter from "./routers/UAccountRequestRouter.js";
import multer from "multer"
console.log(import.meta.dirname)
let app = express();

app.set("view engine", "ejs");
app.set("views", import.meta.dirname + "/templates");
app.use(multer.none())
app.use("/static", express.static("static"));
app.use("/", accountRequestRouter)
app.listen(5656)