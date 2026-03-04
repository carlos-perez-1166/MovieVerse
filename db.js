const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Char402568lie-100*",
  database: "movieverse"
});

db.connect(err => {
  if (err) throw err;
  console.log("🟢 MySQL conectado");
});

module.exports = db;