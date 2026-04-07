const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Priotitize DATABASE_URL (Standard for Neon/Render)
    user: !process.env.DATABASE_URL ? process.env.DB_USER : undefined,
    host: !process.env.DATABASE_URL ? process.env.DB_HOST : undefined,
    database: !process.env.DATABASE_URL ? process.env.DB_NAME : undefined,
    password: !process.env.DATABASE_URL ? process.env.DB_PASSWORD : undefined,
    port: !process.env.DATABASE_URL ? process.env.DB_PORT : undefined,
    ssl: isProduction ? {
        require: true,
        rejectUnauthorized: false
    } : false
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database');
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
