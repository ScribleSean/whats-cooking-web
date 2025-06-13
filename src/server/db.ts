import mysql from 'mysql2/promise';
import 'dotenv/config';

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error(
    'Missing DB env vars. Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (see .env.example)'
  );
}

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});


pool.getConnection()
  .then(conn => {
    console.log('Successfully connected to the database');
    conn.release();  
  })
  .catch(err => {
    console.error('Error connecting to the database:', err.code, err.message);
  });

export default pool;
