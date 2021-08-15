const express = require("express"),
  router = express.Router(),
  models = require('../models'),
  secured = require("./secured");

const {
  option,
  titler
} = require("../option");

const redirectMessage = (res, msg, link) => res.send("<script type='text/javascript'>alert('" + msg + "'); location.href='" + link + "';</script>");

module.exports = (csrfProtection, parseForm) => {
  router.use(async function (req, res, next) {
		secured.router(req, res, await secured.preconditions.position(req, res, {
			rank: "admin",
			user_id: req.session.user ? req.session.user : -1
		}), (req, res) => next(), (req, res) => redirectMessage(res, "권한이 없습니다. 메인으로 이동합니다.", "/user/login?retURL=/create"))
	});

  router.get("/", csrfProtection, (req, res) => res.redirect("/user/lookup/" + req.session.username));

  router.get("/:username", csrfProtection, (req, res) => {
    if (req.session && req.session.login == 1) {
      res.locals.target = {};
      res.locals.targets = undefined;

      if (req.params.username == undefined) res.locals.target.username = req.session.username;
      else res.locals.target.username = req.params.username;

      models.user.findOne({
          where: {
            username: res.locals.target.username
          },
          attributes: ['id', 'username', 'email', 'name', 'grade', 'class', 'number', 'position', 'createdAt', 'authenticated']
        })
        .then(result => {
          if (result != null) {
            res.locals.target = result.dataValues;
            res.render("user/profile.ejs", option({
              title: titler("사용자 색인"),
              link: res.locals.target.username == req.session.username ? "lookup" : "lookup_",
              csrf: req.csrfToken()
            }));
          } else redirectMessage(res, "조회 결과 없습니다.", "./");
        })
        .catch(err => {
          console.log(err);
          redirectMessage(res, "오류 등 예외 발생. 다시 시도하고, 담당자에게 문의하십시오.", "./");
        });
    } else res.redirect("/user/login/?retURL=/user/lookup");
  });

  return router;
};