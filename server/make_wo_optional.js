const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
pool.query('ALTER TABLE checklist_executions ALTER COLUMN wo_id DROP NOT NULL;')
    .then(() => console.log('wo_id ahora es nullable'))
    .catch(console.error)
    .finally(() => pool.end());
