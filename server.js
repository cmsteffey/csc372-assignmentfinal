const express = require("express");
let app = express();
app.set("view engine", "ejs");
app.set("views", __dirname + "/templates");
app.use(express.static("static"));
app.get('/', (req, res) => {

    res.render('index', {welcomeText: "Beep!"});
})
app.listen(5656)