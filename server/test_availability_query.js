const sequelize = require('./src/config/sequelize');

async function testNewQuery() {
    try {
        await sequelize.authenticate();

        const workOrdersWithArea = await sequelize.query(
            `SELECT 
                wo."area_id",
                wo."start_date",
                wo."start_time",
                wo."end_date",
                wo."end_time",
                wo."order_class",
                wo."equipment_condition",
                a."name" AS "Area.name"
             FROM "WorkOrders" wo
             INNER JOIN "Areas" a ON wo."area_id" = a."id"
             WHERE 
                wo."start_date" IS NOT NULL 
                AND wo."end_date" IS NOT NULL
                AND wo."start_time" IS NOT NULL  
                AND wo."end_time" IS NOT NULL
                AND wo."area_id" IS NOT NULL
                AND UPPER(wo."equipment_condition") LIKE '%PARADO%'
                AND (
                    UPPER(wo."order_class") LIKE '%EMERGENCIA%'
                    OR UPPER(wo."order_class") LIKE '%CORRECTIVO%PROGRAMADO%'
                    OR UPPER(wo."order_class") LIKE '%OPERACION%'
                    OR UPPER(wo."order_class") LIKE '%OPERACIÓN%'
                )`,
            {
                type: sequelize.QueryTypes.SELECT,
                raw: true
            }
        );

        console.log(`Found ${workOrdersWithArea.length} work orders matching criteria:\n`);

        if (workOrdersWithArea.length > 0) {
            console.log('Sample records:');
            workOrdersWithArea.slice(0, 5).forEach(wo => {
                console.log(`  Area: ${wo['Area.name']} | Condition: "${wo.equipment_condition}" | Class: "${wo.order_class}"`);
            });

            // Calculate downtime per area
            const areaDowntime = {};
            workOrdersWithArea.forEach(wo => {
                const areaName = wo['Area.name'];
                if (!areaName) return;

                const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
                const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
                const downtimeHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

                areaDowntime[areaName] = (areaDowntime[areaName] || 0) + downtimeHours;
            });

            console.log('\nDowntime by area:');
            Object.entries(areaDowntime).forEach(([area, hours]) => {
                const availability = ((8640 - hours) / 8640 * 100).toFixed(2);
                console.log(`  ${area}: ${hours.toFixed(2)} hours downtime, ${availability}% availability`);
            });
        } else {
            console.log('NO WORK ORDERS FOUND! All areas will show 100% availability.');
            console.log('\nThis means your work orders either:');
            console.log('  1. Don\'t have equipment_condition with "PARADO" in it');
            console.log('  2. Don\'t have order_class matching EMERGENCIA/CORRECTIVO PROGRAMADO/OPERACION');
            console.log('  3. Are missing date/time values');
        }

        await sequelize.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testNewQuery();
