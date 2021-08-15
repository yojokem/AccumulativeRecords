var env = process.env.NODE_ENV || 'development';
env = process.env.environment == "heroku" ? "production" : env;
env = env == "undefined" ? "development" : env;
console.log(process.env.NODE_ENV + "[" + process.env.environment + "] : " + env);
const config = require(__dirname + '/config/config.json')[env];

var Credential = {
  host: config.host,
  port: config.port || 3306,
  user: config.username,
  password: config.password,
  database: config.database,
 
};

module.exports = Credential;
