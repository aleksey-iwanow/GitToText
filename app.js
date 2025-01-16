const express = require("express");
const app = express();
const expressHbs = require("express-handlebars");
const gitGetter = require("./git-getter");
const hbs = require("hbs");
const bodyParser = require('body-parser');
// устанавливаем настройки для файлов layout
app.engine("hbs", expressHbs.engine(
    {
        layoutsDir: "views/layouts", 
        defaultLayout: "layout",
        extname: "hbs"
    }
))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));
app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials");

app.post("/get_repo", function (request, response) {
    if(!request.body) return response.sendStatus(400);
    var url = request.body.url;
    if (url == "") return;

    gitGetter.getAllStructure(url).then((res) => {
        response.json({
            structure: res
        }); // отправляем ответ
    })
    
});

app.use("/", function(_, response){
    response.render("body.hbs");
});


app.listen(3000);