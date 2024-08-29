const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'digiloan',
    password: 'postgres',
    port: 5432,
    connectionString: process.env.DATABASE_URL,
});

pool.connect()
 .then(() => console.log('connected to PostgreSQL'))
 .catch(err => console.error('Connection error', err.stack));

module.exports = pool;
