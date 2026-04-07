const sequelize = require('./src/config/sequelize');

async function analyzeAvailability() {
    try {
        await sequelize.authenticate();
        console.log('=== ANÁLISIS DE DISPONIBILIDAD POR ÁREA ===\n');

        // 1. Get all areas
        const [areas] = await sequelize.query(`
            SELECT id, name, "plantId"
            FROM "Areas"
            ORDER BY "plantId", name
        `);

        console.log(`1. ÁREAS EN EL SISTEMA: ${areas.length}\n`);
        areas.forEach(area => {
            console.log(`   ${area.name} (ID: ${area.id}, Plant: ${area.plantId})`);
        });

        // 2. Get work orders that count as downtime
        const [downtimeOrders] = await sequelize.query(`
            SELECT 
                wo."area_id",
                wo."start_date",
                wo."start_time",
                wo."end_date",
                wo."end_time",
                wo."order_class",
                wo."equipment_condition",
                a."name" AS area_name
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
                )
            ORDER BY wo."area_id"
        `);

        console.log(`\n2. ÓRDENES QUE CUENTAN COMO DOWNTIME: ${downtimeOrders.length}\n`);

        if (downtimeOrders.length === 0) {
            console.log('   ⚠️ No hay órdenes de downtime (EMERGENCIA o CORRECTIVO_PROGRAMADO)');
            console.log('   → Todas las áreas mostrarán 100% disponibilidad\n');
        } else {
            console.log('   Criterios: order_class = EMERGENCIA o CORRECTIVO_PROGRAMADO\n');
            downtimeOrders.slice(0, 5).forEach(wo => {
                console.log(`   Área: ${wo.area_name}`);
                console.log(`      Clase: ${wo.order_class}`);
                console.log(`      Inicio: ${wo.start_date} ${wo.start_time}`);
                console.log(`      Fin: ${wo.end_date} ${wo.end_time}\n`);
            });
        }

        // 3. Calculate downtime by area
        console.log('3. CÁLCULO DE DOWNTIME POR ÁREA:\n');

        const areaDowntime = {};
        downtimeOrders.forEach(wo => {
            const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
            const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
            const hours = (endDateTime - startDateTime) / (1000 * 60 * 60);

            // Skip negative or zero hours
            if (hours <= 0) {
                console.log(`   ⚠️ Orden con ${hours.toFixed(2)} horas en ${wo.area_name}, se omite`);
                return;
            }

            if (!areaDowntime[wo.area_id]) {
                areaDowntime[wo.area_id] = {
                    name: wo.area_name,
                    downtime: 0,
                    orderCount: 0
                };
            }
            areaDowntime[wo.area_id].downtime += hours;
            areaDowntime[wo.area_id].orderCount++;
        });

        Object.entries(areaDowntime).forEach(([areaId, data]) => {
            console.log(`   ${data.name}:`);
            console.log(`      Downtime: ${data.downtime.toFixed(2)} hrs`);
            console.log(`      Órdenes: ${data.orderCount}\n`);
        });

        // 4. Calculate availability percentage
        const ANNUAL_HOURS = 8760; // 24 * 365
        console.log(`4. CÁLCULO DE DISPONIBILIDAD (Total anual: ${ANNUAL_HOURS} hrs):\n`);

        const availabilityByArea = areas.map(area => {
            const downtime = areaDowntime[area.id]?.downtime || 0;
            const availability = ((ANNUAL_HOURS - downtime) / ANNUAL_HOURS * 100).toFixed(2);

            console.log(`   ${area.name}:`);
            console.log(`      Downtime: ${downtime.toFixed(2)} hrs`);
            console.log(`      Disponibilidad: ${availability}%\n`);

            return {
                area: area.name,
                downtime: parseFloat(downtime.toFixed(2)),
                availability: parseFloat(availability)
            };
        });

        // 5. Summary
        console.log('5. RESUMEN:\n');

        const avgAvailability = availabilityByArea.reduce((sum, a) => sum + a.availability, 0) / availabilityByArea.length;
        const areasAt100 = availabilityByArea.filter(a => a.availability === 100).length;
        const areasBelow99 = availabilityByArea.filter(a => a.availability < 99).length;

        console.log(`   Total áreas: ${areas.length}`);
        console.log(`   Áreas al 100%: ${areasAt100}`);
        console.log(`   Áreas <99%: ${areasBelow99}`);
        console.log(`   Disponibilidad promedio: ${avgAvailability.toFixed(2)}%`);

        if (areasAt100 === areas.length) {
            console.log('\n   ⚠️ ADVERTENCIA: Todas las áreas tienen 100% disponibilidad');
            console.log('   Esto puede indicar:');
            console.log('   - No hay órdenes de EMERGENCIA o CORRECTIVO_PROGRAMADO');
            console.log('   - Los datos están incompletos');
            console.log('   - El cálculo necesita revisión');
        }

        console.log('\n=== FIN DEL ANÁLISIS ===');
        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

analyzeAvailability();
