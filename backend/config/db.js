const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisrPool = pool.promise();

promisrPool.query('SELECT 1 + 1 AS solution')
    .then(() => {
        console.log('Successfully connected to MySQL')
    })
    .catch((err) => {
        console.log('Failed to connect to MySQL', err.message);
    });

    module.exports = promisrPool;