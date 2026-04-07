const sequelize = require('./src/config/sequelize');

async function investigateWorkOrders() {
    try {
        await sequelize.authenticate();
        console.log('=== INVESTIGACIÓN DE VALORES EN ÓRDENES DE TRABAJO ===\n');

        // 1. See all distinct equipment conditions
        const [conditions] = await sequelize.query(`
            SELECT DISTINCT "equipment_condition", COUNT(*) as count
            FROM "WorkOrders"
            WHERE "equipment_condition" IS NOT NULL
            GROUP BY "equipment_condition"
            ORDER BY count DESC
        `);

        console.log('1. CONDICIONES DE EQUIPO (equipment_condition):');
        if (conditions.length > 0) {
            conditions.forEach(c => {
                console.log(`   ✓ "${c.equipment_condition}" - ${c.count} registros`);
            });
        } else {
            console.log('   ⚠️ No hay condiciones registradas');
        }

        // 2. See all distinct order classes
        const [classes] = await sequelize.query(`
            SELECT DISTINCT "order_class", COUNT(*) as count
            FROM "WorkOrders"
            WHERE "order_class" IS NOT NULL
            GROUP BY "order_class"
            ORDER BY count DESC
        `);

        console.log('\n2. CLASES DE ORDEN (order_class):');
        if (classes.length > 0) {
            classes.forEach(c => {
                console.log(`   ✓ "${c.order_class}" - ${c.count} registros`);
            });
        } else {
            console.log('   ⚠️ No hay clases registradas');
        }

        // 3. Show sample work orders with both fields
        const [samples] = await sequelize.query(`
            SELECT 
                wo."id",
                wo."equipment_condition",
                wo."order_class",
                wo."start_date",
                wo."end_date",
                wo."start_time",
                wo."end_time",
                a."name" as area_name
            FROM "WorkOrders" wo
            LEFT JOIN "Areas" a ON wo."area_id" = a."id"
            WHERE wo."start_date" IS NOT NULL 
            AND wo."end_date" IS NOT NULL
            AND wo."start_time" IS NOT NULL
            AND wo."end_time" IS NOT NULL
            LIMIT 10
        `);

        console.log('\n3. MUESTRA DE ÓRDENES DE TRABAJO (primeras 10 con fechas):');
        if (samples.length > 0) {
            samples.forEach((wo, idx) => {
                const start = new Date(`${wo.start_date}T${wo.start_time}`);
                const end = new Date(`${wo.end_date}T${wo.end_time}`);
                const hours = ((end - start) / (1000 * 60 * 60)).toFixed(2);

                console.log(`\n   [${idx + 1}] OT #${wo.id}`);
                console.log(`      Área: ${wo.area_name || 'Sin área'}`);
                console.log(`      Condición: "${wo.equipment_condition}"`);
                console.log(`      Clase: "${wo.order_class}"`);
                console.log(`      Duración: ${hours} horas`);
            });
        } else {
            console.log('   ⚠️ No hay órdenes con fechas completas');
        }

        // 4. Count work orders by condition + class combination
        const [combinations] = await sequelize.query(`
            SELECT 
                "equipment_condition",
                "order_class",
                COUNT(*) as count
            FROM "WorkOrders"
            WHERE "equipment_condition" IS NOT NULL
            AND "order_class" IS NOT NULL
            GROUP BY "equipment_condition", "order_class"
            ORDER BY count DESC
        `);

        console.log('\n4. COMBINACIONES (Condición + Clase):');
        if (combinations.length > 0) {
            combinations.forEach(c => {
                console.log(`   "${c.equipment_condition}" + "${c.order_class}" = ${c.count} OTs`);
            });
        } else {
            console.log('   ⚠️ No hay combinaciones');
        }

        console.log('\n=== FIN DE INVESTIGACIÓN ===\n');

        await sequelize.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

investigateWorkOrders();
