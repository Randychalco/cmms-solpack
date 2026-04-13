const { sequelize } = require('./src/models');
require('dotenv').config();

async function truncateTables() {
    try {
        await sequelize.query('TRUNCATE TABLE "sub_machines", "machines", "areas", "plants" RESTART IDENTITY CASCADE;');
        console.log('Tables truncated successfully.');
    } catch (error) {
        console.error('Truncate failed:', error);
    } finally {
        process.exit();
    }
}

truncateTables();
