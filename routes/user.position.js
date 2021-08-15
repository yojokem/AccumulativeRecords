const express = require("express"),
	router = express.Router(),
	models = require('../models'),
	secured = require("./secured");

const {
	option,
	titler
} = require("../option");

const redirectMessage = (res, msg, link) => res.send("<script type='text/javascript'>alert('" + msg + "'); location.href='" + link + "';</script>");
const goBackwtMessage = (res, msg) => res.send("<script type='text/javascript'>alert('" + msg + "'); history.go(-1);</script>");

module.exports = (csrfProtection, parseForm) => {
	router.use(async function (req, res, next) {
		secured.router(req, res, await secured.preconditions.position(req, res, {
			rank: "admin",
			user_id: req.session.user ? req.session.user : -1
		}), (req, res) => next(), (req, res) => redirectMessage(res, "권한이 없습니다. 메인으로 이동합니다.", "/user/login?retURL=/create"))
	})

	router.get("/", csrfProtection, (req, res) => {
		if (req.session && req.session.login == 1) {
			models.position.findAll({
					include: [{
						model: models.user,
						attributes: ['id', 'username']
					}]
				})
				.then(result => {
					if (result != null) {
						res.locals.targets = result;
						res.render("user/position/lister.ejs", option({
							title: titler("직급부 조회"),
							link: "position-lister",
							csrf: req.csrfToken()
						}));
					} else goBackwtMessage(res, "조회 결과 없습니다.");
				})
				.catch(err => {
					console.log(err);
					goBackwtMessage(res, "오류 등 예외 발생. 다시 시도하고, 담당자에게 문의하십시오.");
				});
		} else res.redirect("/user/login/?retURL=/user/position");
	});

	router.get("/s/:username", csrfProtection, (req, res) => {
		res.locals.target = {};
		res.locals.targets = undefined;

		if (req.params.username == undefined) res.locals.target.username = req.session.username;
		else res.locals.target.username = req.params.username;

		if (req.session && req.session.login == 1) {
			models.user.findOne({
				where: {
					username: res.locals.target.username
				},
				attributes: ['id', 'username'],
				include: [{
					model: models.position,
					as: "Position",
					include: [{
						model: models.user,
						attributes: ['username']
					}]
				}]
			}).then(result => {
				if (result != null) {
					res.locals.targets = result.Position;
					res.render("user/position/lister.ejs", option({
						title: titler("직급부 조회"),
						link: res.locals.target.username == req.session.username ? "position-lister" : "position-lister_",
						csrf: req.csrfToken()
					}));
				} else goBackwtMessage(res, "조회 결과 없습니다.");
			});
		} else res.redirect("/user/login/?retURL=/user/position/s/" + res.locals.target.username);
	});

	router.get("/row/:username", csrfProtection, (req, res) => {
		res.locals.target = {};
		res.locals.targets = undefined;

		if (req.params.username == undefined) res.locals.target.username = req.session.username;
		else res.locals.target.username = req.params.username;

		if (req.session && req.session.login == 1) {
			models.user.findOne({
				where: {
					username: res.locals.target.username
				},
				attributes: ['id', 'username'],
				include: [{
					model: models.position,
					as: "Position"
				}]
			}).then(result => {
				if (result != null) {
					res.locals.targets = result.Position;
					res.json(result.Position);
				} else res.json({});
			});
		} else res.redirect("/user/login/?retURL=/user/position/row/" + res.locals.target.username);
	});

	router.post("/add", parseForm, csrfProtection, (req, res) => {
		if (req.session && req.session.login == 1) {
			if (isNaN(Number(req.body.userGroupSelect))) throw new Error("아이디 선택이 올바르지 않습니다. 새로고침 후 다시 시도하십시오.");

			models.position.findOne({
					where: {
						rank: req.body.prank,
						order: req.body.order,
						user_id: isNaN(Number(req.body.userGroupSelect)) ? -1 : Number(req.body.userGroupSelect)
					},
					attributes: ['createdAt']
				})
				.then(result => {
					if (result == null) {
						models.position.create({
							rank: req.body.prank,
							order: req.body.order,
							user_id: Number(req.body.userGroupSelect),
							licensed: req.body.licensed == "on" ? true : false
						}).then(result => {
							if (result != null) {
								res.redirect("/user/rank");
							} else goBackwtMessage(res, "오류 등 예외 발생. 담당자에게 문의하십시오.");
						}).catch(err => goBackwtMessage(res, "SQL 오류 발생. 담당자에게 문의하십시오."));
					} else goBackwtMessage(res, "이 직급은 이미 존재합니다.");
				})
				.catch(err => {
					console.log(err);
					goBackwtMessage(res, "오류 등 예외 발생. 다시 시도하고, 담당자에게 문의하십시오. " + err);
				});
		} else res.redirect("/user/login/?retURL=/user/position/rank");
	});

	router.get("/rank", csrfProtection, (req, res) => {
		if (req.session && req.session.login == 1) {
			models.rank.findAll({
					include: [{
						model: models.position,
						as: "RankS",
						order: [
							['licensed', 'DESC'],
							[models.user, 'username', 'ASC']
						],
						include: [{
							model: models.user,
							attributes: ['username']
						}]
					}],
					order: [
						['level', 'ASC']
					]
				})
				.then(result => {
					if (result != null) {
						res.locals.targets = result;
						res.render("user/position/rank/rank.ejs", option({
							title: titler("직위도 조회"),
							link: "rank",
							csrf: req.csrfToken()
						}));
					} else redirectMessage(res, "조회 결과 없습니다.", "./");
				})
				.catch(err => {
					console.log(err);
					redirectMessage(res, "오류 등 예외 발생. 다시 시도하고, 담당자에게 문의하십시오.", "./");
				});
		} else res.redirect("/user/login/?retURL=/user/rank");
	});

	router.post("/rank/add", parseForm, csrfProtection, (req, res) => {
		if (req.session && req.session.login == 1) {
			models.rank.findOne({
					where: {
						rank: req.body.rank,
						level: req.body.level,
						unuse: req.body.unuse == "on" ? true : false
					},
					attributes: ['createdAt']
				})
				.then(result => {
					if (result == null) {
						models.rank.create({
							rank: req.body.rank,
							level: req.body.level,
							unuse: req.body.unuse == "on" ? true : false
						}).then(result => {
							if (result != null) {
								res.redirect("/user/rank");
							} else goBackwtMessage(res, "오류 등 예외 발생. 담당자에게 문의하십시오.");
						}).catch(err => goBackwtMessage(res, "SQL 오류 발생. 담당자에게 문의하십시오."));
					} else goBackwtMessage(res, "이 직위도는 이미 존재합니다.");
				})
				.catch(err => {
					console.log(err);
					goBackwtMessage(res, "오류 등 예외 발생. 다시 시도하고, 담당자에게 문의하십시오. " + err);
				});
		} else res.redirect("/user/login/?retURL=/user/position/rank");
	});

	router.get("/rank/uniqueRank", csrfProtection, (req, res) => {
		models.rank.findOne({
				where: {
					rank: req.query.value
				},
				attributes: ['id', 'rank']
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

	router.get("/rank/unuse", csrfProtection, (req, res) => {
		models.rank.findOne({
			where: {
				id: req.query.rank_id
			},
			attributes: ['id', 'rank', 'level', 'unuse']
		}).then(result => {
			if (result != null) {
				models.rank.update({
						unuse: result.unuse == 1 ? 0 : 1
					}, {
						where: {
							id: result.id
						}
					})
					.then(resultF => res.send(resultF != 0 ? {
						id: result.id,
						rank: result.rank,
						unuse: result.unuse == 1 ? 0 : 1
					} : {
						id: result.id,
						rank: result.rank,
						licensed: result.unuse
					}))
					.catch(err => {
						console.log(err);
						console.log("Error occurred! Inside of Authentication Update");
						res.send({});
					});
			} else res.send({
				id: result.id,
				rank: result.rank,
				unuse: result.unuse
			});
		}).catch(err => {
			console.log(err);
			console.log("Error occurred! Outside of Authentication Update");
			res.send({});
		})
	});

	router.get("/license", csrfProtection, (req, res) => {
		models.position.findOne({
			where: {
				id: req.query.position_id
			}
		}).then(result => {
			if (result != null) {
				models.position.update({
						licensed: result.licensed == 1 ? 0 : 1
					}, {
						where: {
							id: result.id
						}
					})
					.then(resultF => res.send(resultF != 0 ? {
						id: result.id,
						user_id: result.user_id,
						licensed: result.licensed == 1 ? 0 : 1
					} : {
						id: result.id,
						user_id: result.user_id,
						licensed: result.licensed
					}))
					.catch(err => {
						console.log(err);
						console.log("Error occurred! Inside of Authentication Update");
						res.send({});
					});
			} else res.send({
				id: result.id,
				user_id: result.user_id,
				licensed: result.licensed
			});
		}).catch(err => {
			console.log(err);
			console.log("Error occurred! Outside of Authentication Update");
			res.send({});
		})
	});

	return router;
};