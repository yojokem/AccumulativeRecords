const express = require("express"),
  router = express.Router(),
  models = require('../models'),
  Op = require("sequelize").Op;

const position = require("../models/position");
const secured = require("./secured");
const {
  option,
  titler
} = require("../option");

const multer = require("multer");
const upload = multer({
  dest: __dirname + "/uploads/"
})
const Excel = require("exceljs");

const lookupRouter = require("./user.lookup"),
  historyRouter = require("./user.history"),
  positionRouter = require("./user.position");

const redirectMessage = (res, msg, link) => res.send("<script type='text/javascript'>alert('" + msg + "'); location.href='" + link + "';</script>");

module.exports = (csrfProtection, parseForm) => {
  var logging = false;

  router.get("/", (req, res) => res.redirect("/"));

  router.get("/login", csrfProtection, (req, res) => {
    if (req.session && req.session.login == 1) redirectMessage(res, "이미 접속하셨습니다.", "/");
    else res.render("user/login.ejs", option({
      title: titler("로그인"),
      link: "login",
      retURL: req.query.retURL ? req.query.retURL : "/",
      csrf: req.csrfToken()
    }));
  });

  router.get("/logout", (req, res) => {
    req.session.destroy();
    redirectMessage(res, "접속 해제 완료", "/");
  });

  router.get("/register", csrfProtection, (req, res) => {
    if (req.session && req.session.login == 1) redirectMessage(res, "이미 접속하셨습니다.", "/");
    else res.render("user/register.ejs", option({
      title: titler("회원 가입"),
      link: "register",
      csrf: req.csrfToken()
    }));
  });

  router.use("/lookup", lookupRouter(csrfProtection, parseForm));
  router.get("/lookup-all", csrfProtection, (req, res) => {
    if (req.session && req.session.login == 1) {
      res.locals.target = undefined;
      res.locals.targets = {};

      models.user.findAll({
          attributes: ['id', 'username', 'email', 'name', 'grade', 'class', 'number', 'position', 'createdAt', 'authenticated']
        })
        .then(result => {
          if (result != null) {
            res.locals.targets = result;
            res.render("user/profile.ejs", option({
              title: titler("사용자 색인"),
              link: "lookup_",
              csrf: req.csrfToken()
            }));
          } else redirectMessage(res, "조회 결과 없습니다.", "/lookup");
        })
        .catch(err => {
          console.log(err);
          redirectMessage(res, "오류 등 예외 발생. 다시 시도하고, 담당자에게 문의하십시오.", "./");
        });
    } else res.redirect("/user/login/?retURL=/user/lookup-all");
  });

  router.use("/history", historyRouter(csrfProtection, parseForm));

  router.use("/position", positionRouter(csrfProtection, parseForm));
  router.get("/rank", (req, res) => res.redirect("/user/position/rank"));

  router.post("/login", parseForm, csrfProtection, (req, res) => {
    if (req.session && req.session.login == 1) redirectMessage(res, "이미 접속하셨습니다.", "/");
    else models.user.findOne({
        where: {
          username: req.body.username,
          password: req.body.password
        },
        attributes: ['id', 'username', 'name', 'position', 'grade', 'authenticated'],
        include: [{
          model: models.nickname,
          as: "NicknameVault",
          attributes: ['nickname']
        }, {
          model: models.position,
          as: 'Position'
        }]
      })
      .then(result => {
        if (result != null) {
          if(!logging && !(result.Position.filter((v, n) => v.licensed == 1 && v.rank == "admin").length > 0)) {
            redirectMessage(res, "현재로서는 접속할 수 없습니다.", "/");
            return;
          }

          if (result.dataValues.authenticated == 0) {
            req.session.login = 0;
            req.session.save(() => {
              redirectMessage(res, "접속하시고자 하는 계정은 현재 인증되어 있지 않은 이유로 부득이하게 이용하실 수 없습니다.", "/");
            });
          } else {
            req.session.user = result.id;
            req.session.username = result.username;
            req.session.name = result.name;
            req.session.nickname = result.NicknameVault.length == 0 ? req.session.username : result.NicknameVault[0].nickname;
            req.session.position = result.position;
            req.session.grade = result.grade;
            req.session.login = 1;

            req.session.save(() => {
              if (req.session.login == 1) {
                redirectMessage(res, "접속 성공", req.body._retURL != null || undefined ? req.body._retURL : "/");
              } else redirectMessage(res, "오류 발생. 재시도 요망", "./login");
            });

            (async function () {
              models.login_history.create({
                user_id: result.dataValues.id
              });
            })();
          }
        } else redirectMessage(res, "접속 실패", "/");
      })
      .catch(err => {
        console.log("☆ LOGIN ERROR ☆");
        console.error(err);
        res.send(err);
      });
  });

  router.post("/register", parseForm, csrfProtection, (req, res) => {
    if (req.session && req.session.login == 1) redirectMessage(res, "이미 접속하셨습니다.", "/");
    else {
      models.user.findOne({
          where: {
            username: req.body.username
          },
          attributes: ['createdAt']
        })
        .then(result => {
          if (result == null) {
            models.user.create({
              username: req.body.username,
              password: req.body.password,
              email: req.body.email,
              name: req.body.name,
              grade: req.body.grade,
              class: req.body.class,
              number: req.body.number,
              position: req.body.position
            }).then(result => {
              if (result != null) {
                redirectMessage(res, "가입 완료. 담당자 확인 시까지 대기하십시오. 이메일 수시 확인 요망.", "/");
                ((async function () {
                  models.nickname.create({
                    nickname: req.body.nickname,
                    user_id: result.id
                  });
                })());
              } else redirectMessage(res, "오류 등 예외 발생. 담당자에게 문의하십시오.", "./register");
            }).catch(err => redirectMessage(res, "SQL 오류 발생. 담당자에게 문의하십시오.", "/"));
          } else redirectMessage(res, "이미 존재하는 사용자입니다. 다른 아이디로 시도하세요.", "./register");
        })
        .catch(err => {
          console.log(err);
          redirectMessage(res, "오류 등 예외 발생. 다시 시도하고, 담당자에게 문의하십시오.", "./register");
        });
    }
  });

  // router.get("/test", async(req, res) => {
  //   secured.router(req, res, await secured.preconditions.position(req, res, {
  //     rank: "admin",
  //     user_id: req.session.user ? req.session.user : -1
  //   }), (req, res) => {
  //     res.send("통과");
  //   }, (req, res) => {
  //     res.send("실패");
  //   })
  // })

  router.get("/authenticate", csrfProtection, (req, res) => {
    models.user.findOne({
      where: {
        id: req.query.user_id
      },
      attributes: ['id', 'username', 'authenticated']
    }).then(result => {
      if (result != null) {
        models.user.update({
            authenticated: result.authenticated == 1 ? 0 : 1
          }, {
            where: {
              id: result.id
            }
          })
          .then(resultF => res.send(resultF != 0 ? {
            id: result.id,
            username: result.username,
            authenticated: result.authenticated == 1 ? 0 : 1
          } : {
            id: result.id,
            username: result.username,
            authenticated: result.authenticated
          }))
          .catch(err => {
            console.log(err);
            console.log("Error occurred! Inside of Authentication Update");
            res.send({});
          });
      } else res.send({
        id: result.id,
        username: result.username,
        authenticated: result.authenticated
      });
    }).catch(err => {
      console.log(err);
      console.log("Error occurred! Outside of Authentication Update");
      res.send({});
    })
  });

  router.get("/uniqueUser", csrfProtection, (req, res) => {
    models.user.findOne({
        where: {
          username: req.query.value
        },
        attributes: ['id', 'username']
      })
      .then(result => res.send({
        exist: result == null ? false : true
      }))
      .catch(err => {
        console.log(err);
        console.log("Error occurred!");
        res.send("Error occurred");
      });
  });

  router.get("/uniqueNumber", csrfProtection, (req, res) => {
    models.user.findOne({
        where: {
          grade: req.query.grade,
          class: req.query.class,
          number: req.query.number
        },
        attributes: ['id', 'username']
      })
      .then(result => res.send({
        exist: result == null ? false : true
      }))
      .catch(err => {
        console.log(err);
        console.log("Error occurred!");
        res.send("Error occurred");
      });
  });

  router.get("/number/:id", csrfProtection, (req, res) => {
    models.user.findOne({
        where: {
          id: req.params.id
        },
        attributes: ['id', 'username']
      })
      .then(result => res.send(result.dataValues.username != null || undefined ? result.dataValues.username : ""))
      .catch(err => {
        console.log(err);
        console.log("Error occurred!");
        res.send("<span style='color: red;'>[Error]</span>");
      });
  });

  router.post("/findUser", parseForm, csrfProtection, (req, res) => {
    let searchWord = req.body.name;

    models.user.findAll({
        where: {
          username: {
            [Op.like]: searchWord + "%"
          }
        },
        attributes: ['id', 'username']
      }).then(result => res.json(result))
      .catch(err => {
        console.log(err);
        console.log("Error occurred!");
        res.send("<span style='color: red;'>[Error]</span>");
      });
  });

  router.get("/password", csrfProtection, (req, res) => {
    if(req.session && req.session.login == 1) {
      res.render("user/password.ejs", option({
        title: titler("비밀번호 변경"),
        link: "password",
        csrf: req.csrfToken()
      }));
    } else redirectMessage(res, "로그인 상태가 아닙니다!", "/user/login?retURL=/user/password")
  })

  router.post("/password", parseForm, csrfProtection, (req, res) => {
    if(req.session && req.session.login == 1) {
      const user = req.session.user;
      const current = req.body.current;
      const password = req.body.password;

      models.user.findOne({
        where: {
          id: user,
          password: current
        },
        attributes: ['id', 'username', 'name', 'position', 'grade', 'authenticated']
      })
      .then(result => {
        if (result != null) {
          models.user.update({
            password: password
          }, {
            where: {
              id: user,
              password: current
            }
          }).then(resultFFF => {
            if(resultFFF != 0) redirectMessage(res, "변경 완료", "/");
            else redirectMessage(res, "변경 실패 (전산 오류. 재시도 후 신고 요망)", "/user/password");
          })
        } else redirectMessage(res, "현재 비밀번호가 일치하지 않습니다.", "/user/password");
      })
      .catch(err => {
        console.log("☆ PASSWORD CHANGE ERROR ☆");
        console.error(err);
        res.send(err);
      });
    } else redirectMessage(res, "로그인 상태가 아닙니다!", "/user/login?retURL=/user/password")
  })

  router.get("/loginable", async (req, res) => {
    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "admin",
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => {
      logging = logging ? false : true;
      redirectMessage(res, "로그인 상태: " + (logging ? "가능" : "불가능"), "/user/lookup")
    }, (req, res) => {
      res.redirect('back');
    })
  })

  router.post("/manual", upload.single("file"), async (req, res) => {
    function pwEncrypt(s) {
      return hex_sha512(s).toString().toLowerCase();
    }

    const workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/uploads/" + req.file.filename).then(p => {
      let k = p.worksheets[0];
      //2~5
      k.eachRow(function (row, n) {
        if (n >= 3) {
          let username = row.getCell(2).value.result;
          let password = row.getCell(3).value;
          let name = row.getCell(4).value;
          let grade = row.getCell(5).value;
          let _class = row.getCell(6).value;
          let number = row.getCell(7).value;
          let position = row.getCell(8).value;

          if (!isNaN(grade) && !isNaN(_class) && !isNaN(number) && username != "00000") {
            models.user.create({
              username: username,
              password: pwEncrypt(password),
              email: username + "_" + n + "_valid@valid.com",
              name: name,
              grade: grade,
              'class': _class,
              number: number,
              position: position,
              authenticated: 1
            });
          }
        }
      });
    }).then(() => {
      redirectMessage(res, "처리 중입니다.", "/application");
    })
  });

  return router;
};

function hex_sha512(n) {
  return rstr2hex(rstr_sha512(str2rstr_utf8(n)))
}

function b64_sha512(n) {
  return rstr2b64(rstr_sha512(str2rstr_utf8(n)))
}

function any_sha512(n, t) {
  return rstr2any(rstr_sha512(str2rstr_utf8(n)), t)
}

function hex_hmac_sha512(n, t) {
  return rstr2hex(rstr_hmac_sha512(str2rstr_utf8(n), str2rstr_utf8(t)))
}

function b64_hmac_sha512(n, t) {
  return rstr2b64(rstr_hmac_sha512(str2rstr_utf8(n), str2rstr_utf8(t)))
}

function any_hmac_sha512(n, t, r) {
  return rstr2any(rstr_hmac_sha512(str2rstr_utf8(n), str2rstr_utf8(t)), r)
}

function sha512_vm_test() {
  return "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f" == hex_sha512("abc").toLowerCase()
}

function rstr_sha512(n) {
  return binb2rstr(binb_sha512(rstr2binb(n), 8 * n.length))
}

function rstr_hmac_sha512(n, t) {
  var r = rstr2binb(n);
  r.length > 32 && (r = binb_sha512(r, 8 * n.length));
  for (var e = Array(32), i = Array(32), h = 0; 32 > h; h++) e[h] = 909522486 ^ r[h], i[h] = 1549556828 ^ r[h];
  var a = binb_sha512(e.concat(rstr2binb(t)), 1024 + 8 * t.length);
  return binb2rstr(binb_sha512(i.concat(a), 1536))
}

function rstr2hex(n) {
  try {} catch (t) {
    hexcase = 0
  }
  for (var r, e = hexcase ? "0123456789ABCDEF" : "0123456789abcdef", i = "", h = 0; h < n.length; h++) r = n.charCodeAt(h), i += e.charAt(r >>> 4 & 15) + e.charAt(15 & r);
  return i
}

function rstr2b64(n) {
  try {} catch (t) {
    b64pad = ""
  }
  for (var r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", e = "", i = n.length, h = 0; i > h; h += 3)
    for (var a = n.charCodeAt(h) << 16 | (i > h + 1 ? n.charCodeAt(h + 1) << 8 : 0) | (i > h + 2 ? n.charCodeAt(h + 2) : 0), w = 0; 4 > w; w++) e += 8 * h + 6 * w > 8 * n.length ? b64pad : r.charAt(a >>> 6 * (3 - w) & 63);
  return e
}

function rstr2any(n, t) {
  var r, e, i, h, a, w = t.length,
    o = Array(Math.ceil(n.length / 2));
  for (r = 0; r < o.length; r++) o[r] = n.charCodeAt(2 * r) << 8 | n.charCodeAt(2 * r + 1);
  var l = Math.ceil(8 * n.length / (Math.log(t.length) / Math.log(2))),
    c = Array(l);
  for (e = 0; l > e; e++) {
    for (a = Array(), h = 0, r = 0; r < o.length; r++) h = (h << 16) + o[r], i = Math.floor(h / w), h -= i * w, (a.length > 0 || i > 0) && (a[a.length] = i);
    c[e] = h, o = a
  }
  var s = "";
  for (r = c.length - 1; r >= 0; r--) s += t.charAt(c[r]);
  return s
}

function str2rstr_utf8(n) {
  for (var t, r, e = "", i = -1; ++i < n.length;) t = n.charCodeAt(i), r = i + 1 < n.length ? n.charCodeAt(i + 1) : 0, t >= 55296 && 56319 >= t && r >= 56320 && 57343 >= r && (t = 65536 + ((1023 & t) << 10) + (1023 & r), i++), 127 >= t ? e += String.fromCharCode(t) : 2047 >= t ? e += String.fromCharCode(192 | t >>> 6 & 31, 128 | 63 & t) : 65535 >= t ? e += String.fromCharCode(224 | t >>> 12 & 15, 128 | t >>> 6 & 63, 128 | 63 & t) : 2097151 >= t && (e += String.fromCharCode(240 | t >>> 18 & 7, 128 | t >>> 12 & 63, 128 | t >>> 6 & 63, 128 | 63 & t));
  return e
}

function str2rstr_utf16le(n) {
  for (var t = "", r = 0; r < n.length; r++) t += String.fromCharCode(255 & n.charCodeAt(r), n.charCodeAt(r) >>> 8 & 255);
  return t
}

function str2rstr_utf16be(n) {
  for (var t = "", r = 0; r < n.length; r++) t += String.fromCharCode(n.charCodeAt(r) >>> 8 & 255, 255 & n.charCodeAt(r));
  return t
}

function rstr2binb(n) {
  for (var t = Array(n.length >> 2), r = 0; r < t.length; r++) t[r] = 0;
  for (var r = 0; r < 8 * n.length; r += 8) t[r >> 5] |= (255 & n.charCodeAt(r / 8)) << 24 - r % 32;
  return t
}

function binb2rstr(n) {
  for (var t = "", r = 0; r < 32 * n.length; r += 8) t += String.fromCharCode(n[r >> 5] >>> 24 - r % 32 & 255);
  return t
}

function binb_sha512(n, t) {
  void 0 == sha512_k && (sha512_k = new Array(new int64(1116352408, -685199838), new int64(1899447441, 602891725), new int64(-1245643825, -330482897), new int64(-373957723, -2121671748), new int64(961987163, -213338824), new int64(1508970993, -1241133031), new int64(-1841331548, -1357295717), new int64(-1424204075, -630357736), new int64(-670586216, -1560083902), new int64(310598401, 1164996542), new int64(607225278, 1323610764), new int64(1426881987, -704662302), new int64(1925078388, -226784913), new int64(-2132889090, 991336113), new int64(-1680079193, 633803317), new int64(-1046744716, -815192428), new int64(-459576895, -1628353838), new int64(-272742522, 944711139), new int64(264347078, -1953704523), new int64(604807628, 2007800933), new int64(770255983, 1495990901), new int64(1249150122, 1856431235), new int64(1555081692, -1119749164), new int64(1996064986, -2096016459), new int64(-1740746414, -295247957), new int64(-1473132947, 766784016), new int64(-1341970488, -1728372417), new int64(-1084653625, -1091629340), new int64(-958395405, 1034457026), new int64(-710438585, -1828018395), new int64(113926993, -536640913), new int64(338241895, 168717936), new int64(666307205, 1188179964), new int64(773529912, 1546045734), new int64(1294757372, 1522805485), new int64(1396182291, -1651133473), new int64(1695183700, -1951439906), new int64(1986661051, 1014477480), new int64(-2117940946, 1206759142), new int64(-1838011259, 344077627), new int64(-1564481375, 1290863460), new int64(-1474664885, -1136513023), new int64(-1035236496, -789014639), new int64(-949202525, 106217008), new int64(-778901479, -688958952), new int64(-694614492, 1432725776), new int64(-200395387, 1467031594), new int64(275423344, 851169720), new int64(430227734, -1194143544), new int64(506948616, 1363258195), new int64(659060556, -544281703), new int64(883997877, -509917016), new int64(958139571, -976659869), new int64(1322822218, -482243893), new int64(1537002063, 2003034995), new int64(1747873779, -692930397), new int64(1955562222, 1575990012), new int64(2024104815, 1125592928), new int64(-2067236844, -1578062990), new int64(-1933114872, 442776044), new int64(-1866530822, 593698344), new int64(-1538233109, -561857047), new int64(-1090935817, -1295615723), new int64(-965641998, -479046869), new int64(-903397682, -366583396), new int64(-779700025, 566280711), new int64(-354779690, -840897762), new int64(-176337025, -294727304), new int64(116418474, 1914138554), new int64(174292421, -1563912026), new int64(289380356, -1090974290), new int64(460393269, 320620315), new int64(685471733, 587496836), new int64(852142971, 1086792851), new int64(1017036298, 365543100), new int64(1126000580, -1676669620), new int64(1288033470, -885112138), new int64(1501505948, -60457430), new int64(1607167915, 987167468), new int64(1816402316, 1246189591)));
  var r, e, i = new Array(new int64(1779033703, -205731576), new int64(-1150833019, -2067093701), new int64(1013904242, -23791573), new int64(-1521486534, 1595750129), new int64(1359893119, -1377402159), new int64(-1694144372, 725511199), new int64(528734635, -79577749), new int64(1541459225, 327033209)),
    h = new int64(0, 0),
    a = new int64(0, 0),
    w = new int64(0, 0),
    o = new int64(0, 0),
    l = new int64(0, 0),
    c = new int64(0, 0),
    s = new int64(0, 0),
    f = new int64(0, 0),
    d = new int64(0, 0),
    u = new int64(0, 0),
    _ = new int64(0, 0),
    b = new int64(0, 0),
    g = new int64(0, 0),
    y = new int64(0, 0),
    C = new int64(0, 0),
    v = new int64(0, 0),
    A = new int64(0, 0),
    p = new Array(80);
  for (e = 0; 80 > e; e++) p[e] = new int64(0, 0);
  for (n[t >> 5] |= 128 << 24 - (31 & t), n[(t + 128 >> 10 << 5) + 31] = t, e = 0; e < n.length; e += 32) {
    for (int64copy(w, i[0]), int64copy(o, i[1]), int64copy(l, i[2]), int64copy(c, i[3]), int64copy(s, i[4]), int64copy(f, i[5]), int64copy(d, i[6]), int64copy(u, i[7]), r = 0; 16 > r; r++) p[r].h = n[e + 2 * r], p[r].l = n[e + 2 * r + 1];
    for (r = 16; 80 > r; r++) int64rrot(C, p[r - 2], 19), int64revrrot(v, p[r - 2], 29), int64shr(A, p[r - 2], 6), b.l = C.l ^ v.l ^ A.l, b.h = C.h ^ v.h ^ A.h, int64rrot(C, p[r - 15], 1), int64rrot(v, p[r - 15], 8), int64shr(A, p[r - 15], 7), _.l = C.l ^ v.l ^ A.l, _.h = C.h ^ v.h ^ A.h, int64add4(p[r], b, p[r - 7], _, p[r - 16]);
    for (r = 0; 80 > r; r++) g.l = s.l & f.l ^ ~s.l & d.l, g.h = s.h & f.h ^ ~s.h & d.h, int64rrot(C, s, 14), int64rrot(v, s, 18), int64revrrot(A, s, 9), b.l = C.l ^ v.l ^ A.l, b.h = C.h ^ v.h ^ A.h, int64rrot(C, w, 28), int64revrrot(v, w, 2), int64revrrot(A, w, 7), _.l = C.l ^ v.l ^ A.l, _.h = C.h ^ v.h ^ A.h, y.l = w.l & o.l ^ w.l & l.l ^ o.l & l.l, y.h = w.h & o.h ^ w.h & l.h ^ o.h & l.h, int64add5(h, u, b, g, sha512_k[r], p[r]), int64add(a, _, y), int64copy(u, d), int64copy(d, f), int64copy(f, s), int64add(s, c, h), int64copy(c, l), int64copy(l, o), int64copy(o, w), int64add(w, h, a);
    int64add(i[0], i[0], w), int64add(i[1], i[1], o), int64add(i[2], i[2], l), int64add(i[3], i[3], c), int64add(i[4], i[4], s), int64add(i[5], i[5], f), int64add(i[6], i[6], d), int64add(i[7], i[7], u)
  }
  var m = new Array(16);
  for (e = 0; 8 > e; e++) m[2 * e] = i[e].h, m[2 * e + 1] = i[e].l;
  return m
}

function int64(n, t) {
  this.h = n, this.l = t
}

function int64copy(n, t) {
  n.h = t.h, n.l = t.l
}

function int64rrot(n, t, r) {
  n.l = t.l >>> r | t.h << 32 - r, n.h = t.h >>> r | t.l << 32 - r
}

function int64revrrot(n, t, r) {
  n.l = t.h >>> r | t.l << 32 - r, n.h = t.l >>> r | t.h << 32 - r
}

function int64shr(n, t, r) {
  n.l = t.l >>> r | t.h << 32 - r, n.h = t.h >>> r
}

function int64add(n, t, r) {
  var e = (65535 & t.l) + (65535 & r.l),
    i = (t.l >>> 16) + (r.l >>> 16) + (e >>> 16),
    h = (65535 & t.h) + (65535 & r.h) + (i >>> 16),
    a = (t.h >>> 16) + (r.h >>> 16) + (h >>> 16);
  n.l = 65535 & e | i << 16, n.h = 65535 & h | a << 16
}

function int64add4(n, t, r, e, i) {
  var h = (65535 & t.l) + (65535 & r.l) + (65535 & e.l) + (65535 & i.l),
    a = (t.l >>> 16) + (r.l >>> 16) + (e.l >>> 16) + (i.l >>> 16) + (h >>> 16),
    w = (65535 & t.h) + (65535 & r.h) + (65535 & e.h) + (65535 & i.h) + (a >>> 16),
    o = (t.h >>> 16) + (r.h >>> 16) + (e.h >>> 16) + (i.h >>> 16) + (w >>> 16);
  n.l = 65535 & h | a << 16, n.h = 65535 & w | o << 16
}

function int64add5(n, t, r, e, i, h) {
  var a = (65535 & t.l) + (65535 & r.l) + (65535 & e.l) + (65535 & i.l) + (65535 & h.l),
    w = (t.l >>> 16) + (r.l >>> 16) + (e.l >>> 16) + (i.l >>> 16) + (h.l >>> 16) + (a >>> 16),
    o = (65535 & t.h) + (65535 & r.h) + (65535 & e.h) + (65535 & i.h) + (65535 & h.h) + (w >>> 16),
    l = (t.h >>> 16) + (r.h >>> 16) + (e.h >>> 16) + (i.h >>> 16) + (h.h >>> 16) + (o >>> 16);
  n.l = 65535 & a | w << 16, n.h = 65535 & o | l << 16
}
var hexcase = 0,
  b64pad = "",
  sha512_k;