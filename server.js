let app = require('express')();
app.set("view engine", "ejs");
app.set("views", __dirname + "/templates");
app.get('/', (req, res) => {

    res.render('index', {welcomeText: "Beep!"});
})
app.listen(5656)