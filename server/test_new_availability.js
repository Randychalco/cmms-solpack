const sequelize = require('./src/config/sequelize');

async function testNewAvailabilityQuery() {
    try {
        await sequelize.authenticate();
        console.log('=== PRUEBA DE NUEVA CONSULTA DE DISPONIBILIDAD ===\n');

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

        console.log(`✓ Encontradas ${workOrdersWithArea.length} OTs que cuentan como downtime\n`);

        if (workOrdersWithArea.length > 0) {
            console.log('Primeras 5 OTs:');
            workOrdersWithArea.slice(0, 5).forEach((wo, idx) => {
                const start = new Date(`${wo.start_date}T${wo.start_time}`);
                const end = new Date(`${wo.end_date}T${wo.end_time}`);
                const hours = ((end - start) / (1000 * 60 * 60)).toFixed(2);

                console.log(`  [${idx + 1}] ${wo['Area.name']} - ${wo.order_class} - ${hours} horas`);
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

            // Calculate availability
            const TOTAL_HOURS_PER_YEAR = 24 * 365; // 8,760 hours
            console.log('\n📊 DISPONIBILIDAD POR ÁREA:');
            console.log('─'.repeat(60));

            const availabilityData = Object.entries(areaDowntime).map(([area, downtime]) => {
                const availability = ((TOTAL_HOURS_PER_YEAR - downtime) / TOTAL_HOURS_PER_YEAR * 100).toFixed(2);
                return { area, downtime, availability };
            });

            // Sort by availability
            availabilityData.sort((a, b) => parseFloat(a.availability) - parseFloat(b.availability));

            availabilityData.forEach(({ area, downtime, availability }) => {
                const bar = '█'.repeat(Math.floor(parseFloat(availability) / 2));
                console.log(`  ${area.padEnd(20)} ${availability.padStart(6)}%  ${bar}`);
                console.log(`  ${''.padEnd(20)} ${downtime.toFixed(2)} hrs downtime`);
            });

            // Check for areas with no downtime
            const [allAreas] = await sequelize.query(`SELECT "name" FROM "Areas"`);
            const areasWithNoDowntime = allAreas.filter(a =>
                !availabilityData.find(item => item.area === a.name)
            );

            if (areasWithNoDowntime.length > 0) {
                console.log('\n✓ Áreas con 100% disponibilidad (sin downtime):');
                areasWithNoDowntime.forEach(a => {
                    console.log(`  ${a.name.padEnd(20)} 100.00%`);
                });
            }
        } else {
            console.log('⚠️ No se encontraron OTs que cumplan los criterios');
        }

        console.log('\n=== FIN DE PRUEBA ===');
        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testNewAvailabilityQuery();
