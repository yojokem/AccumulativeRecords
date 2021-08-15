const mysqlx = require("@mysql/xdevapi");
const config = require("./config/config.json");

const client = mysqlx.getClient(config.development, config.pool);
client.getSession().then(session => {
    console.dir(session);
});

const {option, titler} = require("./option");
console.log(titler("d"));


const express = require("express"),
  bodyParser = require("body-parser"),
  cookieParser = require("cookie-parser"),
  ejs = require("ejs"),
  csrf = require("csurf");
 

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());

const csrfProtection = csrf({
  cookie: true
});
const parseForm = bodyParser.urlencoded({
  extended: false
});

app.get("/", (req, res) => {
    console.log(req.cookies);
    res.send("helolo");
})

const port = process.env.PORT || 3434;

app.listen(port, () => console.log(`Listening on port ${port}..`));
