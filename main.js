const express = require("express"),
  bodyParser = require("body-parser"),
  cookieParser = require("cookie-parser"),
  ejs = require("ejs"),
  csrf = require("csurf");

const models = require("./models"),
  main_router = require("./main-router"),
  sql_wrapper = require("./sql_wrapper"),
  constitution = require("./constitution");

const path = require("path");

const userRouter = require("./routes/user");
const postRouter = require("./routes/post");

(async function () {
  await require("./sessions")();
  await require("./init");
})().then(() => {
  const session = require("express-session"),
    MySQLStore = require("express-mysql-session")(session);

  const sessionStore = new MySQLStore(sql_wrapper);

  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(cookieParser());

  app.use(session({
    secret: "2021_0991abcdd_inteltasks_58192efaab_2020",
    resave: false,
    saveUninitialized: false,
    store: sessionStore
  }));

  constitution(app, express);

  sessionStore.all((err, sessions) => {
    if (err) throw err;

    for (var i in sessions) {
      sessionStore.destroy(i, err => {});
    }
  });

  const csrfProtection = csrf({
    cookie: true
  });
  const parseForm = bodyParser.urlencoded({
    extended: false
  });

  const __include = __dirname + "/views/includes/";
  const __statuses = __dirname + "/views/statuses/";
  const includes = {
    head: __include + "head",
    header: __include + "header",
    foot: __include + "foot",
    footer: __include + "footer",
    modal: __include + "modal",
    all: __statuses + "all",
    specify: __statuses + "specify",
    grade: __statuses + "grade",
    class: __statuses + "class",
    user: __statuses + "user"
  };

  const headers = {
    navbarTitle: "소담고 동아리 신청",
    navigation: {
      post: {
        title: "자유 게시판"
      },
      application: {
        title: "신청"
      },
      create: {
        title: "동아리 생성"
      },
      status: {
        title: "신청 현황"
      },
      password: {
        title: "비밀번호 변경"
      }
    }
  }

  app.use(function (req, res, next) { // EJS에 session이라는 지역 변수로 넘겨주기
    res.locals.session = req.session;
    res.locals.includes = g => Object.keys(includes).lastIndexOf(g) < 0 ? "" : includes[g];
    res.locals.headers = g => Object.keys(headers).lastIndexOf(g) < 0 ? "" : headers[g];

    res.locals.APPLIED = -1;
    res.locals.APPLIEDN = "";
    res.locals.APPLIEDONE = false;

    (async () => {
      if (req.session.user && req.session.login == 1) {
        models.application.findAll({
          where: {
            user_id: req.session.user
          },
          include: [{
            model: models.circle,
            attributes: ['id', 'name']
          }]
        }).then(result => {
          if (result.length > 0) {
            let k = 0;
            for (var i in result) {
              let p = result[i];
              if (p.unuse == false) {
                res.locals.APPLIED = p.circle_id;
                res.locals.APPLIEDN = p.circle.name;
                res.locals.APPLIEDONE = true;
                k += 1;
              }
            }

            if (k > 1) {
              models.application.update({
                  unuse: true
                }, {
                  where: {
                    user_id: req.session.user
                  }
                })
                .then(resultF => {
                  res.send("<script type='text/javascript'>alert('" + "중복 신청을 확인하여 모두 자동 취소하였으니 재신청하십시오." + "'); location.href='/application';</script>");
                })
            }
          }
        }).catch(err => {
          console.error(err);
          console.error("Excuses Execution error");
        });
      }
    })();

    next();
  });

  main_router.route(app, csrfProtection, parseForm);

  models.board.findAll()
    .then(result => {
      for (var f in result) {
        f = result[f];
        console.log("※ Board `" + f.name + "` is onboard.")
        app.use('/' + f.parent, postRouter(f.name, f.specifier, "/" + f.parent, f.secure, f.locked, csrfProtection, parseForm));
      }
    }).catch(err => {
      console.error(err);
      console.error("Board boarding error");
    });
  app.use('/user', userRouter(csrfProtection, parseForm));

  const port = process.env.PORT || 8001;

  app.listen(port, () => console.log(`○ §★ Listening on port ${port}..`));
})