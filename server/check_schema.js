const fs = require('fs');
const db = require('./src/config/db');

const checkSchema = async () => {
    try {
        const res = await db.query(`
            SELECT column_name, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        fs.writeFileSync('schema_dump.json', JSON.stringify(res.rows, null, 2));
        console.log('Schema dumped to schema_dump.json');
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

checkSchema();
