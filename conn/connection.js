require('dotenv').config();
const { createPool } = require('mysql');
const connection = createPool({
    host: process.env.host,
    user: process.env.dbUser,
    password: process.env.dbPassword,
    port: process.env.dbPort,
    database: process.env.dbName,
    multipleStatements: true,
    connectionLimit: 10
});

module.exports = connection;

