const models = require('../models');

const {
  option,
  titler
} = require("../option");

const securedf = require("./secured");

const redirectMessage = (res, msg, link) => res.send("<script type='text/javascript'>alert('" + msg + "'); location.href='" + link + "';</script>");
const goBackwtMessage = (res, msg) => res.send("<script type='text/javascript'>alert('" + msg + "'); history.go(-1);</script>");

const viewCount = (user_id, post_id, ip, cookie) => {
  (async function () {
    models.browses.findAll({
      where: {
        user_id: user_id == undefined ? null : user_id,
        post_id: post_id
      }
    }).then(result => {
      b = false, c = false; /// b || c 가 false일 때 browses에 조회 수를 산입한다.
      for (var a in result) {
        b = result[a].dataValues.ip == ip ? true : b;
        c = result[a].dataValues.cookie == cookie ? true : c;

        if (b || c == true) break;
      }
      return b || c;
    }).then(k => {
      if (!k)
        models.browses.create({
          user_id: user_id,
          post_id: post_id,
          ip: ip,
          cookie: cookie,
        })
        .then(result => console.log("Count increase for POST #" + post_id + " by user #" + user_id + " who read the one."))
        .catch(err => {
          console.log("error occurred in view counting!2");
          console.log(err);
        });
    }).catch(err => {
      console.log("error occurred in view counting!3");
      console.log(err);
    });
  })();
}

module.exports = function (boardTitle, boardId, parent, secured, locked, csrfProtection, parseForm) {
  const express = require("express"),
    router = express.Router();
  const pparent = parent.substring(1, parent.length);

  router.use(function (req, res, next) {
    res.locals.parent = parent;
    res.locals.pparent = pparent;
    res.locals.boardTitle = boardTitle;
    res.locals.boardId = boardId;
    next();
  });

  router.use(function (req, res, next) {
    if (secured)
      if (req.session && req.session.login == 1) {
        next();
      } else redirectMessage(res, "미접속으로 권한이 없습니다.", "/");
    else next();
  });

  router.get("/", csrfProtection, (req, res) => {
    models.post.findAll({
        where: {
          board: boardId
        },
        attributes: ['id', 'title', 'user_id', 'createdAt'],
        order: [
          ['updatedAt', 'DESC']
        ],
        include: [{
          model: models.user,
          attributes: ['username']
        }, {
          model: models.browses,
          as: "PostID",
          attributes: ['id', 'post_id', 'createdAt']
        }]
      })
      .then(result => {
        res.locals.target = result;
        console.log(parent);
        res.render("post.ejs", option({
          title: titler(boardTitle),
          link: pparent
        }));
      });
  });

  router.get("/write", csrfProtection, (req, res) => {
    res.render("post_write.ejs", option({
      title: titler(boardTitle + " 글쓰기"),
      link: pparent,
      csrf: req.csrfToken()
    }));
  });

  router.post("/write", csrfProtection, async (req, res) => {
    if (req.session && req.session.login == 1) {
      if (req.body.title.trim() == "")
        goBackwtMessage(res, "제목이 빈칸일 수 없습니다.")
      else if (req.body.content.trim() == "")
        goBackwtMessage(res, "내용이 없을 수 없습니다.")
      else {
        securedf.router(req, res, await securedf.preconditions.position(req, res, {
          rank: "opener",
          user_id: req.session.user ? req.session.user : -1
        }), (req, res) => {
          models.post.create({
            title: req.body.title,
            board: boardId,
            content: req.body.content,
            user_id: req.session.user
          }).then(result => {
            if (result != null) redirectMessage(res, "작성이 완료되었습니다.", parent);
            else redirectMessage(res, "오류 등 예외 발생. 담당자에게 문의하십시오.", "./write");
          }).catch(err => {
            redirectMessage(res, "SQL 오류 발생. 담당자에게 문의하십시오.", "./");
            console.log(err);
          });
        }, (req, res) => {
          redirectMessage(res, '관리자 계정이 아닙니다.', parent);
        });
      }
    } else redirectMessage(res, "접속 상태가 아닙니다.", "/user/login?retURL=" + parent + "/write");
  });

  router.get("/view/:id", csrfProtection, (req, res) => {
    const ip = req.ip.substring(req.ip.lastIndexOf(":") + 1, req.ip.length);

    models.post.findOne({
        where: {
          id: req.params.id,
          board: boardId
        },
        include: [{
          model: models.user,
          attributes: ['username']
        }, {
          model: models.browses,
          as: "PostID",
          attributes: ['id', 'post_id', 'createdAt']
        }]
      })
      .then(result => {
        const cookieKey = req.cookies['connect.sid'] ? req.cookies['connect.sid'].substring(
          req.cookies['connect.sid'].indexOf(':') + 1,
          req.cookies['connect.sid'].indexOf('.')) : "";
        viewCount(req.session.user, req.params.id, ip, cookieKey);
        return result;
      })
      .then(result => {
        res.locals.target = result;
        res.render("post.view.ejs", option({
          title: titler(result.dataValues.title),
          link: pparent + (result.dataValues != null ? result.dataValues.id : ""),
          csrf: req.csrfToken()
        }));
      })
      .catch(err => {
        console.log(err);
        redirectMessage(res, "오류 등 예외 발생. 다시 시도하고, 담당자에게 문의하십시오.", parent);
      });
  });

  router.get("/browses/:id", csrfProtection, (req, res) => {
    models.browses.findAll({
        where: {
          post_id: req.params.id
        },
        attributes: ['id', 'post_id', 'createdAt']
      }).then(result => res.send(String(result != null ? result.length : 0)))
      .catch(err => {
        console.log(err);
        redirectMessage(res, "오류 등 예외 발생. 다시 시도하고, 담당자에게 문의하십시오.", "./");
      });
  });

  return router;
};