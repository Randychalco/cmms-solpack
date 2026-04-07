const { Client } = require('pg');
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'cmms_db',
    password: 'root',
    port: 5432,
});

async function checkTables() {
    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables in cmms_db:');
        res.rows.forEach(row => console.log('- ' + row.table_name));
    } catch (err) {
        console.error('Error connecting to DB:', err);
    } finally {
        await client.end();
    }
}

checkTables();
