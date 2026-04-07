const sequelize = require('./src/config/sequelize');
const { Area } = require('./src/models');

async function testFinalCalculation() {
    try {
        await sequelize.authenticate();
        console.log('=== PRUEBA FINAL DE DISPONIBILIDAD ===\n');

        // Execute the exact same query as the controller
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
                AND (
                    wo."order_class" = 'EMERGENCIA'
                    OR wo."order_class" = 'CORRECTIVO_PROGRAMADO'
                )`,
            {
                type: sequelize.QueryTypes.SELECT,
                raw: true
            }
        );

        console.log(`✓ OTs encontradas para downtime: ${workOrdersWithArea.length}\n`);

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

        // Calculate availability percentage (8,760 hours per year)
        const TOTAL_HOURS_PER_YEAR = 24 * 365; // 8,760 hours
        const availabilityByArea = Object.entries(areaDowntime).map(([area, downtime]) => ({
            area: area,
            availability: parseFloat(((TOTAL_HOURS_PER_YEAR - downtime) / TOTAL_HOURS_PER_YEAR * 100).toFixed(2))
        }));

        // Get all areas to ensure they all appear
        const allAreas = await Area.findAll({
            attributes: ['name'],
            raw: true
        });

        allAreas.forEach(areaObj => {
            const areaName = areaObj.name;
            if (!availabilityByArea.find(item => item.area === areaName)) {
                availabilityByArea.push({
                    area: areaName,
                    availability: 100.0
                });
            }
        });

        // Sort by availability
        availabilityByArea.sort((a, b) => a.availability - b.availability);

        console.log('📊 RESULTADO FINAL - Disponibilidad por Área:\n');
        console.log('═'.repeat(60));
        availabilityByArea.forEach(item => {
            const bar = '█'.repeat(Math.floor(item.availability / 2));
            const downtime = areaDowntime[item.area] || 0;
            console.log(`  ${item.area.padEnd(20)} ${item.availability.toFixed(2).padStart(6)}% ${bar}`);
            if (downtime > 0) {
                console.log(`  ${''.padEnd(20)} (${downtime.toFixed(2)} hrs downtime)`);
            }
        });
        console.log('═'.repeat(60));

        console.log('\n✓ Este es el resultado que verás en el dashboard!');
        console.log('\n=== FIN DE PRUEBA ===');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testFinalCalculation();
