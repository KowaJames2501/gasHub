const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'Kowa',
  password: 'Kowa@2501.',
  database: 'gas_hub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();