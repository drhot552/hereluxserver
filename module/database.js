//database 연결구조
const db = require('mysql');
const config = require('../module/db_server').dev;


module.exports.conn= function(){
  const conn = db.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database

  });
  conn.connect();
  return conn;
}

//dev
