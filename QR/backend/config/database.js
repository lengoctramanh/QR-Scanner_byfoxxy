const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

// Ham nay dung de thu mot truy van nho luc khoi dong de xac nhan ket noi MySQL san sang.
// Nhan vao: khong nhan tham so, su dung promisePool da duoc khoi tao.
// Tac dong: ghi log ket noi thanh cong hoac that bai ra console.
promisePool
  .query("SELECT 1 + 1 AS solution")
  .then(() => {
    console.log("Connected to MySQL successfully.");
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

module.exports = promisePool;
