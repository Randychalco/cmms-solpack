const sequelize = require('./src/config/sequelize');

async function analyzeAvailabilityData() {
    try {
        await sequelize.authenticate();
        console.log('=== ANÁLISIS DE DISPONIBILIDAD ===\n');

        // 1. Check total work orders with dates
        const [totalWithDates] = await sequelize.query(
            `SELECT COUNT(*) as count 
             FROM "WorkOrders" 
             WHERE "start_date" IS NOT NULL 
             AND "end_date" IS NOT NULL
             AND "start_time" IS NOT NULL
             AND "end_time" IS NOT NULL
             AND "area_id" IS NOT NULL`
        );
        console.log(`1. Total OTs con fechas completas: ${totalWithDates[0].count}\n`);

        // 2. Check distinct equipment conditions
        const [conditions] = await sequelize.query(
            `SELECT DISTINCT "equipment_condition", COUNT(*) as count
             FROM "WorkOrders"
             WHERE "equipment_condition" IS NOT NULL
             GROUP BY "equipment_condition"
             ORDER BY count DESC`
        );
        console.log('2. Condiciones de equipo existentes:');
        conditions.forEach(c => console.log(`   "${c.equipment_condition}": ${c.count} OTs`));

        // 3. Check distinct order classes
        const [classes] = await sequelize.query(
            `SELECT DISTINCT "order_class", COUNT(*) as count
             FROM "WorkOrders"
             WHERE "order_class" IS NOT NULL
             GROUP BY "order_class"
             ORDER BY count DESC`
        );
        console.log('\n3. Clases de orden existentes:');
        classes.forEach(c => console.log(`   "${c.order_class}": ${c.count} OTs`));

        // 4. Check which work orders have dates AND area
        const [withAreaAndDates] = await sequelize.query(
            `SELECT wo."equipment_condition", wo."order_class", a."name" as area_name, COUNT(*) as count
             FROM "WorkOrders" wo
             INNER JOIN "Areas" a ON wo."area_id" = a."id"
             WHERE wo."start_date" IS NOT NULL 
             AND wo."end_date" IS NOT NULL
             AND wo."start_time" IS NOT NULL
             AND wo."end_time" IS NOT NULL
             AND wo."area_id" IS NOT NULL
             GROUP BY wo."equipment_condition", wo."order_class", a."name"
             ORDER BY count DESC
             LIMIT 10`
        );
        console.log('\n4. Top 10 combinaciones de condición + clase con fechas:');
        withAreaAndDates.forEach(row => {
            console.log(`   Área: "${row.area_name}" | Condición: "${row.equipment_condition}" | Clase: "${row.order_class}" | Count: ${row.count}`);
        });

        // 5. Check work orders with PARADO (case insensitive)
        const [withParado] = await sequelize.query(
            `SELECT COUNT(*) as count
             FROM "WorkOrders"
             WHERE UPPER("equipment_condition") LIKE '%PARADO%'
             AND "start_date" IS NOT NULL
             AND "end_date" IS NOT NULL`
        );
        console.log(`\n5. OTs con "PARADO" en condición: ${withParado[0].count}`);

        // 6. Sample of work orders that could be counted for downtime
        const [samples] = await sequelize.query(
            `SELECT 
                wo."id",
                wo."equipment_condition",
                wo."order_class",
                a."name" as area_name,
                wo."start_date",
                wo."end_date"
             FROM "WorkOrders" wo
             LEFT JOIN "Areas" a ON wo."area_id" = a."id"
             WHERE wo."start_date" IS NOT NULL 
             AND wo."end_date" IS NOT NULL
             AND wo."start_time" IS NOT NULL
             AND wo."end_time" IS NOT NULL
             LIMIT 5`
        );
        console.log('\n6. Muestra de 5 OTs con fechas completas:');
        samples.forEach(row => {
            console.log(`   ID: ${row.id}`);
            console.log(`   Área: ${row.area_name || 'SIN ÁREA'}`);
            console.log(`   Condición: "${row.equipment_condition}"`);
            console.log(`   Clase: "${row.order_class}"`);
            console.log(`   Fechas: ${row.start_date} - ${row.end_date}`);
            console.log('   ---');
        });

        await sequelize.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

analyzeAvailabilityData();
