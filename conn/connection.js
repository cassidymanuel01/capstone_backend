require('dotenv').config();
const { createPool } = require('mysql');
const pool = createPool({
    host: process.env.host,
    user: process.env.dbUser,
    password: process.env.dbPassword,
    port: process.env.dbPort,
    database: process.env.dbName,
    multipleStatements: true,
    connectionLimit: 10
});

module.exports = pool;

const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    // Your API Link
    proxy: 'https://capstone-backend-api-1.herokuapp.com/'
  }
})

