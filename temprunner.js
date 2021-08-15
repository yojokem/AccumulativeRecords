const models = require("./models");
require("./init");

models.application.findAll({
    include: [{
        model: models.user
    }]
}).then(result => {
    console.log(result)
    if (result.length > 0) {
        for (let r of result) {
            const id = r.user.id;
            const validApp = !r.unuse;

            (async (user, v) => {
                if (v) {
                    models.user.update({
                        authenticated: true
                    }, {
                        where: {
                            id: user
                        }
                    }).then(r => console.log(r))
                }
            })(id, validApp);
        }
    }
})