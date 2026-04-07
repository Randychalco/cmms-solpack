const { WorkOrder, Area } = require('./src/models');
const sequelize = require('./src/config/sequelize');

async function diagnoseDashboard() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database\n');

        // 1. Check total work orders with complete date/time data
        const totalWOs = await WorkOrder.count({
            where: {
                start_date: { [sequelize.Sequelize.Op.ne]: null },
                end_date: { [sequelize.Sequelize.Op.ne]: null },
                start_time: { [sequelize.Sequelize.Op.ne]: null },
                end_time: { [sequelize.Sequelize.Op.ne]: null },
                area_id: { [sequelize.Sequelize.Op.ne]: null }
            }
        });
        console.log(`Total Work Orders with complete date/time/area: ${totalWOs}`);

        // 2. Check distinct equipment_condition values
        const conditions = await sequelize.query(
            `SELECT DISTINCT equipment_condition, COUNT(*) as count 
             FROM "WorkOrders" 
             WHERE equipment_condition IS NOT NULL 
             GROUP BY equipment_condition 
             ORDER BY count DESC`,
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log('\nDistinct Equipment Conditions:');
        conditions.forEach(c => console.log(`  - "${c.equipment_condition}": ${c.count} orders`));

        // 3. Check distinct order_class values
        const orderClasses = await sequelize.query(
            `SELECT DISTINCT order_class, COUNT(*) as count 
             FROM "WorkOrders" 
             WHERE order_class IS NOT NULL 
             GROUP BY order_class 
             ORDER BY count DESC`,
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log('\nDistinct Order Classes:');
        orderClasses.forEach(c => console.log(`  - "${c.order_class}": ${c.count} orders`));

        // 4. Check work orders matching our criteria
        const matchingWOs = await WorkOrder.findAll({
            where: {
                start_date: { [sequelize.Sequelize.Op.ne]: null },
                end_date: { [sequelize.Sequelize.Op.ne]: null },
                start_time: { [sequelize.Sequelize.Op.ne]: null },
                end_time: { [sequelize.Sequelize.Op.ne]: null },
                area_id: { [sequelize.Sequelize.Op.ne]: null },
                equipment_condition: {
                    [sequelize.Sequelize.Op.or]: ['PARADO', 'Parado']
                },
                order_class: {
                    [sequelize.Sequelize.Op.or]: [
                        'EMERGENCIA',
                        'Emergencia',
                        'CORRECTIVO_PROGRAMADO',
                        'CORRECTIVO PROGRAMADO',
                        'Correctivo Programado',
                        'OPERACION',
                        'Operacion',
                        'Operación'
                    ]
                }
            },
            attributes: ['id', 'equipment_condition', 'order_class', 'start_date', 'end_date'],
            limit: 10,
            raw: true
        });

        console.log(`\nWork Orders matching availability criteria: ${matchingWOs.length}`);
        if (matchingWOs.length > 0) {
            console.log('Sample matching orders:');
            matchingWOs.forEach(wo => {
                console.log(`  ID: ${wo.id}, Condition: "${wo.equipment_condition}", Class: "${wo.order_class}"`);
            });
        }

        await sequelize.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

diagnoseDashboard();
