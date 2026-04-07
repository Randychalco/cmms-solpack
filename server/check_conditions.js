const sequelize = require('./src/config/sequelize');

async function checkEquipmentConditions() {
    try {
        await sequelize.authenticate();

        // Check combined equipment_condition and order_class
        const combined = await sequelize.query(
            `SELECT 
                equipment_condition, 
                order_class, 
                COUNT(*) as count,
                SUM(CASE WHEN start_date IS NOT NULL AND end_date IS NOT NULL THEN 1 ELSE 0 END) as with_dates
             FROM "WorkOrders" 
             WHERE equipment_condition IS NOT NULL AND order_class IS NOT NULL
             GROUP BY equipment_condition, order_class 
             ORDER BY count DESC`,
            { type: sequelize.QueryTypes.SELECT }
        );

        console.log('Equipment Condition + Order Class combinations:');
        console.log('='.repeat(80));
        combined.forEach(c => {
            console.log(`Condition: "${c.equipment_condition}" | Class: "${c.order_class}" | Total: ${c.count} | With Dates: ${c.with_dates}`);
        });

        await sequelize.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkEquipmentConditions();
