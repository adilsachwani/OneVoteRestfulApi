const mysql = require('mysql');

// Set database connection credentials
const config = {
    host: 'remotemysql.com',
    user: '5hlRzk0EyL',
    password: '15NeiDa8ep',
    database: '5hlRzk0EyL',
    port: 3306,
    debug: false,
    multipleStatements: true
};

// Create a MySQL pool
const pool = mysql.createPool(config);

// Export the pool
module.exports = pool;