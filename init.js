const models = require("./models");

module.exports = models.sequelize.sync().then(() => {
    console.log("○ §★ Database Connection has been carried out successfully.");

    models.board.findOne({
      where: {
        parent: 'post'
      }
    }).then(result => {
      if (result == null) {
        models.board.create({
          name: "자유 게시판",
          specifier: 0,
          parent: 'post'
        })
      }
    })

    models.rank.findOne({
      where: {
        rank: "admin"
      }
    }).then(result => {
      if (result == null) {
        models.rank.create({
          rank: "admin",
          level: 0,
          unuse: false
        });
      }
    })

    models.user.findOne({
      where: {
        username: "root"
      }
    }).then(result => {
      if (result == null) {
        models.user.create({
          username: "root",
          ///sodamhs2021!JHGF
          password: "3c080896d186f6193412ee77aa415dbfd61336e63f65c437bc6c54c377dbc4772a5b390c790bafc8e4894554aeb07de3a5bd7416b74b95b617350ff778c412c3",
          email: "root@valid.com",
          name: "관리자",
          grade: 0,
          class: 0,
          number: 0,
          position: "관리자",
          authenticated: 1
        }).then(result => {
          models.position.create({
            rank: "admin",
            order: 0,
            user_id: result.id,
            licensed: true
          })
        });
      }
    })
  }).catch(err => {
    console.log("○ §★ Database Connection has been failed.");
    console.error(err);
  });