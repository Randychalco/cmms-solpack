const { Client } = require('pg');
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'cmms_db',
    password: 'root',
    port: 5432,
});

async function run() {
    try {
        await client.connect();
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('--- TABLES ---');
        console.log(tables.rows.map(r => r.table_name).join(', '));

        for (const table of tables.rows) {
            const count = await client.query(`SELECT COUNT(*) FROM \"${table.table_name}\"`);
            console.log(`${table.table_name}: ${count.rows[0].count} rows`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
        process.exit();
    }
}
run();
