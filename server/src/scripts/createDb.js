const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres', // Connect to default postgres db to create new db
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

async function createDatabase() {
    const client = new Client(config);
    try {
        await client.connect();

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);

        if (res.rowCount === 0) {
            console.log(`Database ${process.env.DB_NAME} not found. Creating...`);
            await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
            console.log(`Database ${process.env.DB_NAME} created successfully.`);
        } else {
            console.log(`Database ${process.env.DB_NAME} already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
}

createDatabase();
