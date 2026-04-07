require('dotenv').config();
const { sequelize } = require('./src/models');

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');
        const desc = await sequelize.getQueryInterface().describeTable('WorkOrders');
        console.log('technician_id definition:');
        console.log(JSON.stringify(desc.technician_id, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}
check();
