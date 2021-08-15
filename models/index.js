'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
var env = process.env.NODE_ENV || 'development';
env = process.env.environment == "heroku" ? "production" : env;
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

console.log("Database points to " + config.host + " in Environment '" + env + "'");

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

Object.keys(db).forEach(modelName => {
  db[modelName].beforeBulkUpdate(({attributes, where}) => {
    var updated = new Date();
    attributes['updatedAt'] = `${updated.getFullYear().toString().padStart(4, '0')}-${
    (updated.getMonth()+1).toString().padStart(2, '0')}-${
    updated.getDate().toString().padStart(2, '0')} ${updated.getHours().toString().padStart(2, '0')}:${
    updated.getMinutes().toString().padStart(2, '0')}:${
    updated.getSeconds().toString().padStart(2, '0')}`;
  });

  db[modelName].beforeBulkUpdate(({attributes, where}) => {
    // where - in one of the fields of the clone of second argument sent to .update
    // attributes - is one of the fields that the clone of second argument of .update would be extended with
    db[modelName].findAll({
      where: where,
      attributes: ['id', ...Object.keys(attributes)]
    }).then(resultF => {
      if(resultF != null || resultF.length == 0) {
        for(var a in resultF) {
          db.alteration.create({
            table: db[modelName].tableName,
            identifier: resultF[a].dataValues.id,
            values: (() => {
              let returns = {};
              let keys = Object.keys(attributes);
                for(var k in keys)
                  returns[keys[k]] = {
                    oldVal: resultF[a].dataValues[keys[k]],
                    newVal: attributes[keys[k]]
                  };
              return returns;
            })(),
            isProper: (typeof where.isProper == Boolean) ? where.isProper : true
          })
          .then(result => console.log("§★ Update Alteration Fetch [#" + result.id + "] completed for Row #" + resultF[a].id + " of the table `" + db[modelName].tableName + "`"))
          .catch(err => {
            console.log("Error occurred while updating the table `" + db[modelName].tableName + "` in process.");
            console.log(err);
          });
        }
      } else console.log("No one found while updating the row of the table `" + db[modelName].tableName + "`.");
    }).catch(err => {console.log("Alteration Fetching Error!"); console.log(err);});
  });
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
