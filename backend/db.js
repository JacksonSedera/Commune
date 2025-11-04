import mysql from 'mysql2/promise';

export default mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'deliberation-letters',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});