const express = require("express"),
      router = express.Router(),
      models = require('../models');

const option = require("../option");

const redirectMessage = (res, msg, link) => res.send("<script type='text/javascript'>alert('" + msg + "'); location.href='" + link + "';</script>");

module.exports = (csrfProtection, parseForm) => {
  router.get("/", csrfProtection, (req, res) => res.redirect("/user/history/" + req.session.username));

  router.get("/:username", csrfProtection, (req, res) => {
    if(req.session && req.session.login == 1) {
      res.locals.target = {};

      if(req.params.username == undefined) res.locals.target.username = req.session.username;
      else res.locals.target.username = req.params.username;

      res.render("user/profile.ejs", option({title: titler("사용자 색인"), link: res.locals.target.username == req.session.username ? "lookup_" : "lookup", csrf: req.csrfToken()}));
    } else res.redirect("/user/login/?retURL=/user/lookup/" + req.params.username);
  });

  return router;
};
