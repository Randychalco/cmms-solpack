require('dotenv').config();
const { sequelize, WorkOrder } = require('./src/models');

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');
        const desc = await sequelize.getQueryInterface().describeTable('WorkOrders');
        console.log('technician_id TYPE:', desc.technician_id.type);

        console.log('Attempting insert...');
        await WorkOrder.create({
            ticket_number: 'TEST-' + Date.now(),
            order_class: 'CORRECTIVO_PROGRAMADO',
            status: 'ABIERTA',
            priority: 'MEDIA',
            technician_id: 'TEST_TECH_NAME', // String value
            plant_id: null,
            area_id: null,
            machine_id: null,
            sub_machine_id: null
        });
        console.log('Insert SUCCESS!');

    } catch (e) {
        console.error('Insert FAILED:', e.original ? e.original.message : e.message);
        if (e.original && e.original.code) {
            console.error('Error Code:', e.original.code);
        }
    } finally {
        await sequelize.close();
    }
}
check();
