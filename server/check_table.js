const { sequelize } = require('./src/models');
require('dotenv').config();

async function checkTable() {
    try {
        const [results] = await sequelize.query("SELECT * FROM \"Areas\" LIMIT 5");
        console.log('Raw Areas Data:', results);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

checkTable();
