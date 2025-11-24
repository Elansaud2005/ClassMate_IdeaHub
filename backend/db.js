// db.js
// mysql connection for classmate idea hub

const mysql = require("mysql2/promise");

// create a small connection pool (faster + safer than single connection)
const pool = mysql.createPool({
  host: "localhost",       // server (keep localhost)
  user: "root",            // your mysql username
  password: "",            // add your mysql password here (if any)
  database: "classmate_db",// name of your database
  waitForConnections: true,
  connectionLimit: 10,     // max open connections
  queueLimit: 0,           // unlimited waiting queue
});

// export pool so server.js can use it
module.exports = pool;
