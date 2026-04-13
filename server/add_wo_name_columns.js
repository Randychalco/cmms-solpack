require('dotenv').config();
const sequelize = require('./src/config/sequelize');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');

        const queries = [
            `ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS leader_technician_name VARCHAR(255)`,
            `ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS supervisor_name VARCHAR(255)`,
        ];

        for (const q of queries) {
            try {
                await sequelize.query(q);
                console.log('✓', q);
            } catch (err) {
                console.error('✗', q, err.message);
            }
        }

        console.log('\nDone. Both columns added to work_orders table.');
        process.exit(0);
    } catch (err) {
        console.error('Connection error:', err.message);
        process.exit(1);
    }
}

migrate();
