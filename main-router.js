const {
  option,
  titler
} = require("./option");
const models = require("./models");
const Op = require("sequelize").Op;
const secured = require("./routes/secured")
const multer = require("multer");
const upload = multer({
  dest: __dirname + "/uploads/"
})
const Excel = require("exceljs");
const iconvLite = require('iconv-lite');

const get = (app, link, filename, options) => app.get(link, (req, res) => res.render(filename, options));
const redirectMessage = (res, msg, link) => res.send("<script type='text/javascript'>alert('" + msg + "'); location.href='" + link + "';</script>");
const goBackwtMessage = (res, msg) => res.send("<script type='text/javascript'>alert('" + msg + "'); history.go(-1);</script>");

function getDownloadFilename(req, filename) {
  var header = req.headers['user-agent'];

  if (header.includes("MSIE") || header.includes("Trident")) {
    return encodeURIComponent(filename).replace(/\\+/gi, "%20");
  } else if (header.includes("Chrome")) {
    return iconvLite.decode(iconvLite.encode(filename, "UTF-8"), 'ISO-8859-1');
  } else if (header.includes("Opera")) {
    return iconvLite.decode(iconvLite.encode(filename, "UTF-8"), 'ISO-8859-1');
  } else if (header.includes("Firefox")) {
    return iconvLite.decode(iconvLite.encode(filename, "UTF-8"), 'ISO-8859-1');
  }

  return filename;
}

/**
 * `rows` must have in order of arrays of rows
 * @param {Array<JSON>} rows 
 * rows = [''/title*, {
 * title: "",
 * header: [...]
 * data: [[...]]
 * }]
 * @param {ReadableStream} input
 * @param {WritableStream} output
 */
const exportExcel = async (rows, input, output) => {
  const workbook = new Excel.Workbook();

  const updated = new Date();

  const filename = getDownloadFilename(input, rows[0] + ` ${updated.getFullYear().toString().padStart(4, '0')}${
    (updated.getMonth()+1).toString().padStart(2, '0')}${
    updated.getDate().toString().padStart(2, '0')}_${updated.getHours().toString().padStart(2, '0')}${
    updated.getMinutes().toString().padStart(2, '0')}${
    updated.getSeconds().toString().padStart(2, '0')}.xlsx`);

  for (let i = 1; i < rows.length; i++) {
    i = Number(i);
    let cursor = rows[i];

    let continues = true;

    cursor.data.forEach(v => {
      if (cursor.header.length != v.length) {
        continues = false;
      }
    })

    if (continues) {
      let sheet = workbook.addWorksheet(cursor.title);

      let header = cursor.header;
      let datas = cursor.data;
      const time = `${updated.getFullYear().toString().padStart(4, '0')}-${
        (updated.getMonth()+1).toString().padStart(2, '0')}-${
        updated.getDate().toString().padStart(2, '0')} ${updated.getHours().toString().padStart(2, '0')}:${
        updated.getMinutes().toString().padStart(2, '0')}:${
        updated.getSeconds().toString().padStart(2, '0')}`;
      sheet.getCell(1, 1).value = time;
      sheet.getRow(2).height = 50;
      sheet.getCell(2, 3).style.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      sheet.getCell(2, 3).style.font = {
        'font': {
          'bold': true,
          'size': 16,
          'color': {
            'theme': 1
          },
          'name': '?????? ??????'
        },
        'text': 'format'
      }
      sheet.getCell(2, 3).value = cursor.title;

      for (let k = 0; k < header.length; k++) {
        sheet.getCell(3, k + 2).style.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
        sheet.getCell(3, k + 2).value = header[k];
        sheet.getColumn(k + 2).width = 20;
      }

      for (let r = 0; r < datas.length; r++) {
        let current = datas[r];
        for (let c = 0; c < current.length; c++) {
          sheet.getCell(r + 4, c + 2).style.alignment = {
            vertical: 'middle',
            horizontal: 'center'
          };
          sheet.getCell(r + 4, c + 2).value = current[c];
        }
      }

      sheet.columns.forEach(function (column, i) {
        var maxLength = 0;
        column["eachCell"]({
          includeEmpty: true
        }, function (cell) {
          var columnLength = cell.value ? cell.value.toString().length : 12;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 12 ? 12 : maxLength;
      });
    } else {
      console.error("Header length and data length of given Row `" + i + "`");
    }
  }

  output.setHeader("Content-Type", "application/vnd.openxmlformats");
  output.setHeader("Content-Disposition", "attachment; filename=" + filename);

  await workbook.xlsx.write(output);
  output.end();
}

const route = (app, csrfProtection, parseForm) => {
  var accessible = false;

  app.get("/", (req, res) => {
    res.render("index.ejs", option({
      title: titler("?????????????????????"),
      link: "home"
    }));
  });

  app.get("/home", (req, res) => res.redirect("/"));

  app.get("/information", (req, res) => {
    res.render("information.ejs", option({
      title: titler("??????"),
      link: "information"
    }));
  });

  app.get("/records", (req, res) => {
    res.render("records.ejs", option({
      title: titler("?????? ??????"),
      link: "records"
    }));
  });

  app.get("/precedents", (req, res) => {
    res.render("precedents.ejs", option({
      title: titler("??????"),
      link: "precedents"
    }));
  });

  app.get("/courtroom", (req, res) => {
    res.render("courtroom.ejs", option({
      title: titler("??????"),
      link: "courtroom"
    }));
  });

  app.get("/apply/:s", csrfProtection, (req, res) => {
    if (req.session.user && req.session.login == 1) {
      if(!accessible) {
        redirectMessage(res, "??????????????? ????????? ??? ????????????.", "/");
        return;
      }
      const circle = req.params.s;
      models.application.findAll({
        where: {
          user_id: req.session.user
        }
      }).then(result => {
        let kp = false;

        if (result.length > 0) {
          for (var i in result) {
            let p = result[i];
            if (p.unuse == false) {
              kp = false;
              redirectMessage(res, "?????? ?????? ????????? ?????????????????????.", "/application");
              return;
            }
          }
          kp = true;
        } else {
          kp = true;
        }

        if (kp) {
          models.circle.findOne({
            where: {
              id: circle
            },
            include: [{
              model: models.application,
              attributes: ['id', 'unuse'],
              include: [{
                model: models.user,
                attributes: ['grade']
              }]
            }, {
              model: models.grade_limit,
              as: "Limit"
            }]
          }).then(resultF => {
            let key = req.session.grade == 1 ? "first" : req.session.grade == 2 ? "second" : "third";
            if (resultF.applications.filter((v, n) => v.unuse == false && v.user.grade == req.session.grade).length < resultF.Limit.option[key]) {
              models.application.create({
                user_id: req.session.user,
                circle_id: circle
              }).then(ret => {
                if (ret != null) {
                  redirectMessage(res, "?????? ??????", "/application");
                } else redirectMessage(res, "?????? ??? ?????? ??????. ??????????????? ??????????????????.", "/application");
              });
            } else {
              redirectMessage(res, "?????? ???????????? " + req.session.grade + "?????? ????????? ??? ????????????!", "/application");
            }
          }).catch(err => {
            redirectMessage(res, "?????? ??????! ?????? ??????????????? ???????????? ????????? ???????????? ???????????? ?????????", "/application");
            console.log(err);
          });
        }
      }).catch(err => {
        redirectMessage(res, "?????? ??????! ?????? ??????????????? ???????????? ????????? ???????????? ???????????? ?????????", "/application");
        console.log(err);
      });
    } else res.redirect("/user/login/?retURL=/application");
  })

  app.get('/password', csrfProtection, (req, res) => res.redirect('/user/password'));

  app.get("/application", csrfProtection, (req, res) => {
    if (req.session.user && req.session.login == 1) {
      function go() {
        models.circle.findAll({
          where: {
            active: true
          },
          order: [
            ['createdAt', 'ASC']
          ],
          include: [{
            model: models.application,
            attributes: ['accept', 'unuse'],
            include: [{
              model: models.user,
              attributes: ['grade']
            }]
          }, {
            model: models.grade_limit,
            as: "Limit"
          }]
        }).then(result => {
          res.locals.targets = result;
          res.render("application.ejs", option({
            title: titler("??????"),
            link: "application"
          }))
        }).catch(err => {
          redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "./");
          console.log(err);
        });
      }

      res.locals.APPLIED = -1;
      res.locals.APPLIEDN = "";
      res.locals.APPLIEDONE = false;

      models.application.findAll({
        where: {
          user_id: req.session.user
        },
        include: [{
          model: models.circle,
          attributes: ['id', 'name'],
          include: [{
            model: models.grade_limit,
            as: "Limit"
          }]
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
                res.send("<script type='text/javascript'>alert('" + "?????? ????????? ???????????? ?????? ?????? ?????????????????? ?????????????????????." + "'); location.href='/application';</script>");
              })
          } else {
            go();
          }
        } else go();
      });
    } else res.redirect("/user/login/?retURL=/application");
  });

  app.get("/create", csrfProtection, async (req, res) => {
    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "admin",
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => res.render("application_create.ejs", option({
      title: titler("????????? ??????"),
      link: "create",
      csrf: req.csrfToken()
    })), (req, res) => redirectMessage(res, "????????? ????????????. ???????????? ???????????????.", "/user/login?retURL=/create"))
  });

  app.post("/create", csrfProtection, async (req, res) => {
    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "admin",
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => {
      const first = req.body.grade1 == "on" ? 1 : 0;
      const second = req.body.grade2 == "on" ? 1 : 0;
      const third = req.body.grade3 == "on" ? 1 : 0;

      if (req.body.name.trim() == "")
        goBackwtMessage(res, "??????????????? ????????? ??? ????????????.")
      else if (req.body.detail.trim() == "")
        goBackwtMessage(res, "????????? ?????? ??? ????????????.")
      else {
        models.circle.create({
          name: req.body.name,
          detail: req.body.detail,
          endTime: "" + req.body.endDate + " " + req.body.endTime + ":00",
          minimal: req.body.minimal,
          maximal: req.body.maximal
        }).then(result => {
          if (result != null) {
            redirectMessage(res, "????????? ?????????????????????.", "/application");
            models.grade_limit.create({
              option: {
                first: first,
                second: second,
                third: third,
              },
              circle_id: result.id
            });
          } else redirectMessage(res, "?????? ??? ?????? ??????. ??????????????? ??????????????????.", "/");
        }).catch(err => {
          redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "/");
          console.log(err);
        });
      }
    }, (req, res) => redirectMessage(res, "????????? ????????????. ???????????? ???????????????.", "/"))
  });

  app.get("/create2", async (req, res) => {
    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "admin",
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => res.render("circle_create_file.ejs", option({
      title: titler("????????? ??????"),
      link: "create"
    })), (req, res) => redirectMessage(res, "????????? ????????????. ???????????? ???????????????.", "/user/login?retURL=/create2"))
  });

  /** Status */

  app.get("/status", csrfProtection, async (req, res) => {
    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "opener",
      order: 1,
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => {
      models.circle.findAll({
        where: {
          active: true
        },
        order: [
          ['name', 'ASC']
        ],
        include: [{
          model: models.application,
          order: [
            ['createdAt', 'DESC']
          ],
          include: [{
            model: models.user
          }]
        }, {
          model: models.grade_limit,
          as: "Limit"
        }]
      }).then(result => {
        res.locals.targets = result;

        res.render("status.ejs", option({
          title: titler("????????? ?????? ??????"),
          link: "status",
          authorized: 1,
          order: 'all',
          csrf: req.csrfToken()
        }))
      }).catch(err => {
        redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "./");
        console.log(err);
      });
    }, (req, res) => redirectMessage(res, "????????? ????????????. ???????????? ???????", "/user/login?retURL=/status"))
  });

  app.get("/status/:p", csrfProtection, async (req, res) => {
    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "opener",
      order: 1,
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => {
      models.circle.findOne({
        where: {
          active: true,
          name: req.params.p
        },
        order: [
          ['name', 'ASC']
        ],
        include: [{
          model: models.application,
          order: [
            ['createdAt', 'DESC']
          ],
          include: [{
            model: models.user
          }]
        }, {
          model: models.grade_limit,
          as: "Limit"
        }]
      }).then(result => {
        if (result == null) {
          redirectMessage(res, "?????? ???????????? ?????? ??? ????????????.", '/status');
          return;
        }
        res.locals.target = result;

        res.render("status.ejs", option({
          title: titler("????????? ?????? ??????"),
          link: "status",
          authorized: 1,
          order: 'specify',
          csrf: req.csrfToken()
        }))
      }).catch(err => {
        redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "./");
        console.log(err);
      });
    }, (req, res) => redirectMessage(res, "????????? ????????????. ???????????? ???????", "/user/login?retURL=/status/" + req.params.p))
  });

  // p = 3 | 2 | 1
  app.get("/status/grade/:p", csrfProtection, async (req, res) => {
    if (isNaN(req.params.p)) {
      res.redirect("/status");
      return;
    }

    const p = Number(req.params.p);
    if (p != 1 && p != 2 && p != 3) {
      redirectMessage(res, "?????? ????????? ????????????.", "/status")
      return;
    }

    models.user.findAll({
      where: {
        grade: p
      },
      order: [
        ['grade', 'ASC'],
        ['class', 'ASC'],
        ['number', 'ASC']
      ],
      include: [{
        model: models.application,
        include: [{
          model: models.circle,
          include: [{
            model: models.grade_limit,
            as: "Limit"
          }]
        }]
      }]
    }).then(async (result) => {
      res.locals.targets = result;

      secured.router(req, res, await secured.preconditions.position(req, res, {
        rank: "opener",
        order: 3,
        user_id: req.session.user ? req.session.user : -1
      }), (req, res) => res.render("status.ejs", option({
        title: titler("????????? ?????? ??????"),
        link: "status",
        authorized: 1,
        order: 'grade',
        csrf: req.csrfToken()
      })), (req, res) => redirectMessage(res, "????????? ????????????. ???????????? ???????", "/user/login?retURL=/status/grade/" + p))
    }).catch(err => {
      redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "/status");
      console.log(err);
    });
  })

  app.get("/status/class/:p", csrfProtection, async (req, res) => {
    if (!/^([1-3]{1})([0-9]{2})$/.test(req.params.p)) {
      res.redirect("/status");
      return;
    }

    const grade = Number(req.params.p.substring(0, 1));
    const _class = Number(req.params.p.substring(1, 3));

    models.user.findAll({
      where: {
        grade: grade,
        'class': _class
      },
      order: [
        ['number', 'ASC']
      ],
      include: [{
        model: models.application,
        include: [{
          model: models.circle,
          include: [{
            model: models.grade_limit,
            as: "Limit"
          }]
        }]
      }]
    }).then(async (result) => {
      res.locals.targets = result;

      secured.router(req, res, await secured.preconditions.position(req, res, {
        rank: "opener",
        order: 4,
        user_id: req.session.user ? req.session.user : -1
      }), (req, res) => res.render("status.ejs", option({
        title: titler("????????? ?????? ??????"),
        link: "status",
        authorized: 1,
        order: 'class',
        csrf: req.csrfToken()
      })), (req, res) => redirectMessage(res, "????????? ????????????. ???????????? ???????", "/user/login?retURL=/status/class/" + grade + ("" + _class).padStart(2, '0')))
    }).catch(err => {
      redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "./");
      console.log(err);
    });
  })

  app.get("/status/s/:p", csrfProtection, async (req, res) => {
    const username = req.params.p;

    if (!req.session.user || req.session.login == 0) {
      redirectMessage(res, "???????????? ???????????????!", "/user/login?retURL=/status/s/" + username);
      return;
    }

    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "opener",
      order: 5,
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => {
      models.user.findOne({
        where: {
          username: username
        },
        order: [
          [models.application, 'createdAt', 'DESC']
        ],
        include: [{
          model: models.application,
          include: [{
            model: models.circle,
            include: [{
              model: models.grade_limit,
              as: "Limit"
            }]
          }]
        }]
      }).then(result => {
        res.locals.target = result;
        res.render("status.ejs", option({
          title: titler("????????? ?????? ??????"),
          link: "status",
          authorized: 1,
          order: 'user',
          csrf: req.csrfToken()
        }))
      }).catch(err => {
        redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "./");
        console.log(err);
      });
    }, (req, res) => res.redirect("/status/s/" + req.session.username))
  });

  app.get("/status/capture/download/:order/:id", csrfProtection, async (req, res) => {
    const order = req.params.order.trim();
    const id = req.params.id.trim();

    if (!req.session.user || req.session.login == 0) {
      redirectMessage(res, "???????????? ???????????????!", "/user/login?retURL=/status/capture/download/user/" + id);
      return;
    }

    if (res.locals.includes(order) == "") {
      goBackwtMessage(res, "?????? order??? ?????? ??? ????????????.");
      return;
    }

    if (isNaN(id)) {
      goBackwtMessage(res, "id ????????? ????????? ????????? ????????????.");
      return;
    }

    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "opener",
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => {
      if (order == "all") {
        models.circle.findAll({
          where: {
            active: true
          },
          order: [
            ['name', 'ASC']
          ],
          include: [{
            model: models.application,
            order: [
              ['createdAt', 'DESC']
            ],
            include: [{
              model: models.user
            }]
          }, {
            model: models.grade_limit,
            as: "Limit"
          }]
        }).then(result => {
          /**
           * `rows` must have in order of arrays of rows
           * @param {Array} rows 
           * rows = [''/title*, {
           * title: "",
           * header: [...]
           * data: [[...]]
           * }]
           */
          if (result.length > 0) {
            let rows = [];
            for (let circle of result) {
              const title = circle.name;
              const header = ['??????', '??????', '??????', '??????', '??????', '?????? ??????'];
              const datas = [];

              for (let application of circle.applications) {
                let unuse = application.unuse ? "??????" : "??????";
                let accept = application.accept ? "??????" : "??????";

                let GCNS = application.user.grade + (application.user.class + "").padStart(2, '0') + (application.user.number + "").padStart(2, '0');
                let name = application.user.name;

                if (!application.unuse)
                  datas.push([application.id, GCNS, name, accept, unuse, application.createdAt]);
              }

              datas.push(['', '', '', '', '', ''])

              for (let application of circle.applications) {
                let unuse = application.unuse ? "??????" : "??????";
                let accept = application.accept ? "??????" : "??????";

                let GCNS = application.user.grade + (application.user.class + "").padStart(2, '0') + (application.user.number + "").padStart(2, '0');
                let name = application.user.name;

                if (application.unuse)
                  datas.push([application.id, GCNS, name, accept, unuse, application.createdAt]);
              }
              rows.push({
                title: title,
                header: header,
                data: datas
              });
            }
            exportExcel(['?????? ??????', ...rows], req, res)
          } else goBackwtMessage(res, "???????????? ????????? ????????? ???????????????.")
        }).catch(err => {
          goBackwtMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.");
          console.log(err);
        });
      } else if (order == "specify") {
        models.circle.findOne({
          where: {
            active: true,
            id: id
          },
          order: [
            ['name', 'ASC']
          ],
          include: [{
            model: models.application,
            order: [
              ['createdAt', 'DESC']
            ],
            include: [{
              model: models.user
            }]
          }, {
            model: models.grade_limit,
            as: "Limit"
          }]
        }).then(result => {
          if (result == null) {
            redirectMessage(res, "?????? ???????????? ?????? ??? ????????????.", '/status')
            return;
          }

          let rows = [];
          const title = result.name;
          const header = ['??????', '??????', '??????', '??????', '??????', '?????? ??????'];
          const datas = [];

          for (let application of result.applications) {
            let unuse = application.unuse ? "??????" : "??????";
            let accept = application.accept ? "??????" : "??????";

            let GCNS = application.user.grade + (application.user.class + "").padStart(2, '0') + (application.user.number + "").padStart(2, '0');
            let name = application.user.name;

            if (!application.unuse)
              datas.push([application.id, GCNS, name, accept, unuse, application.createdAt]);
          }

          datas.push(['', '', '', '', '', ''])

          for (let application of result.applications) {
            let unuse = application.unuse ? "??????" : "??????";
            let accept = application.accept ? "??????" : "??????";

            let GCNS = application.user.grade + (application.user.class + "").padStart(2, '0') + (application.user.number + "").padStart(2, '0');
            let name = application.user.name;

            if (application.unuse)
              datas.push([application.id, GCNS, name, accept, unuse, application.createdAt]);
          }
          rows.push({
            title: title,
            header: header,
            data: datas
          });
          exportExcel(['????????? `' + result.name + '` ?????? ??????', ...rows], req, res)
        }).catch(err => {
          redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "./");
          console.log(err);
        });
      } else if (order == "grade") {
        if (id != 1 && id != 2 && id != 3) {
          redirectMessage(res, "?????? ????????? ????????????.", "/status")
          return;
        }

        models.user.findAll({
          where: {
            grade: id
          },
          order: [
            ['grade', 'ASC'],
            ['class', 'ASC'],
            ['number', 'ASC']
          ],
          include: [{
            model: models.application,
            include: [{
              model: models.circle,
              include: [{
                model: models.grade_limit,
                as: "Limit"
              }]
            }]
          }]
        }).then(async (results) => {
          let rows = [];

          if (results.length > 0) {
            const title = id + "?????? ?????? ??????";
            const header = ['??????', '??????', '?????????', '??????', '??????', '?????? ??????'];
            const datas = [];

            for (let user of results) {
              let GCNS = user.grade + (user.class + "").padStart(2, '0') + (user.number + "").padStart(2, '0');
              let name = user.name;
              let thisOneHasOne = user.applications.filter((v, n) => v.unuse == false).length > 0;

              for (let application of user.applications) {
                let unuse = application.unuse ? "??????" : "??????";
                let accept = application.accept ? "??????" : "??????";

                let circleName = thisOneHasOne ? application.circle.name : "";
                if (!application.unuse) {
                  datas.push([GCNS, name, circleName, accept, unuse, application.createdAt]);
                  break;
                }
              }

              if (user.applications.length == 0) {
                datas.push([GCNS, name, "", '', '', '']);
              }
            }

            rows.push({
              title: title,
              header: header,
              data: datas
            });
            exportExcel([id + '?????? ????????? ?????? ??????', ...rows], req, res)
          } else {
            goBackwtMessage(res, "?????? ????????? ???????????? ????????????.");
          }
        }).catch(err => {
          redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "/status");
          console.log(err);
        });
      } else if (order == "class") {
        if (!/^([1-3]{1})([0-9]{2})$/.test(id)) {
          res.redirect("/status");
          return;
        }

        const grade = Number(id.substring(0, 1));
        const _class = Number(id.substring(1, 3));

        models.user.findAll({
          where: {
            grade: grade,
            'class': _class
          },
          order: [
            ['number', 'ASC']
          ],
          include: [{
            model: models.application,
            include: [{
              model: models.circle,
              include: [{
                model: models.grade_limit,
                as: "Limit"
              }]
            }]
          }]
        }).then(async results => {
          let rows = [];

          if (results.length > 0) {
            const title = grade + "?????? " + _class + "??? ?????? ??????";
            const header = ['??????', '??????', '?????????', '??????', '??????', '?????? ??????'];
            const datas = [];

            for (let user of results) {
              let GCNS = user.grade + (user.class + "").padStart(2, '0') + (user.number + "").padStart(2, '0');
              let name = user.name;
              let thisOneHasOne = user.applications.filter((v, n) => v.unuse == false).length > 0;

              for (let application of user.applications) {
                let unuse = application.unuse ? "??????" : "??????";
                let accept = application.accept ? "??????" : "??????";

                let circleName = thisOneHasOne ? application.circle.name : "";
                if (!application.unuse) {
                  datas.push([GCNS, name, circleName, accept, unuse, application.createdAt]);
                  break;
                }
              }

              if (user.applications.length == 0) {
                datas.push([GCNS, name, "", '', '', '']);
              }
            }

            rows.push({
              title: title,
              header: header,
              data: datas
            });
            exportExcel([grade + '?????? ' + _class + '??? ????????? ?????? ??????', ...rows], req, res)
          } else {
            goBackwtMessage(res, "?????? ????????? ???????????? ????????????.");
          }
        }).catch(err => {
          redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "./");
          console.log(err);
        });
      } else if (order == "user") {
        models.user.findOne({
          where: {
            id: id
          },
          order: [
            [models.application, 'createdAt', 'DESC']
          ],
          include: [{
            model: models.application,
            include: [{
              model: models.circle,
              include: [{
                model: models.grade_limit,
                as: "Limit"
              }]
            }]
          }]
        }).then(async result => {
          let rows = [];

          if (result) {
            let GCNS = result.grade + (result.class + "").padStart(2, '0') + (result.number + "").padStart(2, '0');
            let name = result.name;

            const title = GCNS + " " + name + "(" + result.username + ") ?????? ??????";
            const header = ['??????', '??????', '?????????', '??????', '??????', '?????? ??????'];
            const datas = [];

            let thisOneHasOne = result.applications.filter((v, n) => v.unuse == false).length > 0;

            for (let application of result.applications) {
              let unuse = application.unuse ? "??????" : "??????";
              let accept = application.accept ? "??????" : "??????";

              let circleName = thisOneHasOne ? application.circle.name : "";
              if (!application.unuse) {
                datas.push([GCNS, name, circleName, accept, unuse, application.createdAt]);
                break;
              }
            }

            datas.push(['', '', '', '', '', '']);

            for (let application of result.applications) {
              let unuse = application.unuse ? "??????" : "??????";
              let accept = application.accept ? "??????" : "??????";

              let circleName = thisOneHasOne ? application.circle.name : "";
              if (application.unuse) {
                datas.push([GCNS, name, circleName, accept, unuse, application.createdAt]);
                break;
              }
            }

            rows.push({
              title: title,
              header: header,
              data: datas
            });
            exportExcel([GCNS + " " + name + "(" + result.username + ") ????????? ?????? ??????", ...rows], req, res)
          } else {
            goBackwtMessage(res, "?????? ???????????? ????????????.");
          }
        }).catch(err => {
          redirectMessage(res, "SQL ?????? ??????. ??????????????? ??????????????????.", "./");
          console.log(err);
        });
      } else {
        goBackwtMessage(res, "??? ?????? ???????????? ?????? ??????????????? ????????? ???????????? ????????????.");
        return;
      }
    }, (req, res) => {
      res.send(req.params.order + ":" + req.params.id);
    });
  });

  /** Status End */

  app.post("/file_create", upload.single("file"), async (req, res) => {
    const workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/uploads/" + req.file.filename).then(p => {
      let k = p.worksheets[0];
      //2~5
      k.eachRow(function (row, n) {
        if (n >= 3) {
          let name = row.getCell(2).value;
          let detail = row.getCell(3).value;
          let minimal = row.getCell(4).value;
          let maximal = row.getCell(5).value;
          let endTime = row.getCell(6).value;

          let first = row.getCell(7).value;
          let second = row.getCell(8).value;
          let third = row.getCell(9).value;

          models.circle.create({
            name: name,
            detail: detail,
            endTime: endTime,
            minimal: minimal,
            maximal: maximal.result
          }).then(res => {
            if (res != null) {
              models.grade_limit.create({
                circle_id: res.id,
                option: {
                  first: first,
                  second: second,
                  third: third
                }
              });
            }
          })
        }
      });
    }).then(() => {
      redirectMessage(res, "?????? ????????????.", "/application");
    })
  });

  app.post("/assignFile", upload.single("file"), async (req, res) => {
    const workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/uploads/" + req.file.filename).then(p => {
      let k = p.worksheets[0];
      //2~5
      k.eachRow(function (row, n) {
        if (n >= 3) {
          let username = row.getCell(2).value;
          let circle_id = row.getCell(3).value;

          models.user.findOne({
            where: {
              username: username
            },
            attributes: ['id']
          }).then(result => {
            if(result) {
              models.application.update({
                unuse: true,
                accept: false
              }, {
                where: {
                  user_id: result.id
                }
              }).then(rrrr => {
                models.application.create({
                  circle_id: circle_id,
                  user_id: result.id,
                  accept: true,
                  unuse: false
                })
              });
            }
          }).catch(err => console.error(err));
        }
      });
    }).then(() => {
      redirectMessage(res, "?????? ????????????.", "/application");
    })
  });

  app.get("/force/apply/:circle/:GCNS/:name", async (req, res) => {
    const circle = req.params.circle;

    if (isNaN(circle)) {
      res.redirect('back');
      return;
    }

    if (isNaN(req.params.GCNS)) {
      res.redirect('back');
      return;
    }

    const grade = Number(req.params.GCNS.substring(0, 1));
    const _class = Number(req.params.GCNS.substring(1, 3));

    const name = req.params.name;
    console.log(grade)
    console.log(_class)
    console.log(name)

    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "opener",
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => {
      models.user.findOne({
        where: {
          grade: grade,
          'class': _class,
          name: name
        }
      }).then(resF => {
        if (resF != null) {
          const user_id = resF.id;

          models.application.findAll({
            where: {
              user_id: user_id,
              unuse: false
            }
          }).then(resf => {
            if (resf.length > 0) {
              for(let e of resf) {
                models.application.update({
                  accept: false,
                  unuse: true
                }, {
                  where: {
                    id: e.id
                  }
                }).catch(err => {
                  console.log(err);
                  console.log("Error occurred! Outside of Application Unuse Update");
                  redirectMessage(res, "????????? ??????????????????.", "/application");
                })
              }

              models.circle.findOne({
                where: {
                  id: circle
                }
              }).then(result => {
                if (result != null) {
                  models.application.create({
                    circle_id: result.id,
                    user_id: user_id,
                    accept: true,
                    unuse: false
                  })
                }

                res.redirect('back');
              })
            } else models.circle.findOne({
              where: {
                id: circle
              }
            }).then(result => {
              if (result != null) {
                models.application.create({
                  circle_id: result.id,
                  user_id: user_id,
                  accept: true,
                  unuse: false
                })
              }

              res.redirect('back');
            })
          })
        } else res.redirect('back')
      })
    }, (req, res) => {
      redirectMessage(res, "????????? ?????????.", "/user/login?retURL=/status");
    });
  })

  app.get("/force/accept/:app", csrfProtection, async (req, res) => {
    const app = req.params.app;

    if (isNaN(app)) {
      res.redirect('back');
      return;
    }

    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "opener",
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => {
      models.application.findOne({
        where: {
          id: app
        }
      }).then(resf => {
        if (resf != null)
          models.application.update({
            accept: !resf.accept
          }, {
            where: {
              id: app
            }
          }).then(resultF => {
            res.redirect('back');
          }).catch(err => {
            console.log(err);
            console.log("Error occurred! Outside of Application Unuse Update");
            redirectMessage(res, "????????? ??????????????????.", "/application");
          })
      })
    }, (req, res) => {
      redirectMessage(res, "????????? ?????????.", "/user/login?retURL=/status");
    });
  })

  app.get("/force/unuse/:app", csrfProtection, async (req, res) => {
    const app = req.params.app;

    if (isNaN(app)) {
      res.redirect('back');
      return;
    }

    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "opener",
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => {
      models.application.findOne({
        where: {
          id: app
        }
      }).then(resf => {
        if (resf != null)
          models.application.update({
            unuse: !resf.unuse
          }, {
            where: {
              id: app
            }
          }).then(resultF => {
            res.redirect('back');
          }).catch(err => {
            console.log(err);
            console.log("Error occurred! Outside of Application Unuse Update");
            redirectMessage(res, "????????? ??????????????????.", "/application");
          })
      })
    }, (req, res) => {
      redirectMessage(res, "????????? ?????????.", "/user/login?retURL=/status");
    });
  })

  app.get("/unuse", csrfProtection, (req, res) => {
    if (!(req.session.user && req.session.login == 1)) {
      res.redirect('back');
      return;
    }

    if(!accessible) {
      redirectMessage(res, "??????????????? ????????? ??? ????????????.", "/");
      return;
    }

    models.application.update({
      unuse: true
    }, {
      where: {
        user_id: req.session.user
      }
    }).then(resultF => {
      redirectMessage(res, "?????? ?????????????????????!", "/application")
    }).catch(err => {
      console.log(err);
      console.log("Error occurred! Outside of Application Unuse Update");
      redirectMessage(res, "????????? ??????????????????.", "/application");
    })
  });

  app.post("/findCircle", parseForm, csrfProtection, (req, res) => {
    let searchWord = req.body.name;

    models.circle.findAll({
        where: {
          name: {
            [Op.like]: searchWord + "%"
          }
        }
      }).then(result => res.json(result))
      .catch(err => {
        console.log(err);
        console.log("Error occurred!");
        res.send("<span style='color: red;'>[Error]</span>");
      });
  });

  app.get("/accessible", async (req, res) => {
    secured.router(req, res, await secured.preconditions.position(req, res, {
      rank: "admin",
      user_id: req.session.user ? req.session.user : -1
    }), (req, res) => {
      accessible = accessible ? false : true;
      redirectMessage(res, "?????? ?????? ??????: " + (accessible ? "??????" : "?????????"), "/status")
    }, (req, res) => {
      res.redirect('back');
    })
  })

  app.get("/service", (req, res) => {
    res.render("service.ejs", option({
      title: titler("??????"),
      link: "service"
    }));
  });

  app.get("/favicon.ico", (req, res) => res.sendFile(__dirname + "/public/inteltasks_logo(500x500).png"));
};

module.exports = {
  route: route
};
