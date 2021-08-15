module.exports = () => {
  const sql_wrapper = require("./sql_wrapper");

  var conn = require("mysql").createConnection(sql_wrapper);

  conn.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    conn.query(`
CREATE TABLE IF NOT EXISTS sessions (
session_id varchar(128) CHARACTER SET utf8 NOT NULL,
expires int unsigned NOT NULL,
data mediumtext CHARACTER SET utf8,
PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

`, function (err, result) {
      if (err) throw err;
      conn.destroy();
    });
  });
}