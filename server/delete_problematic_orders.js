const sequelize = require('./src/config/sequelize');

async function deleteProblematicOrders() {
    try {
        await sequelize.authenticate();
        console.log('=== ELIMINACIÓN DE ÓRDENES PROBLEMÁTICAS ===\n');

        const problematicOrderIds = [1, 10];

        // 1. Show orders before deletion
        console.log('1. ÓRDENES A ELIMINAR:\n');
        for (const orderId of problematicOrderIds) {
            const [orders] = await sequelize.query(`
                SELECT id, "technician_id", "start_date", "start_time", "end_date", "end_time"
                FROM "WorkOrders"
                WHERE id = :orderId
            `, {
                replacements: { orderId }
            });

            if (orders.length > 0) {
                const order = orders[0];
                const startDateTime = new Date(`${order.start_date}T${order.start_time}`);
                const endDateTime = new Date(`${order.end_date}T${order.end_time}`);
                const hours = (endDateTime - startDateTime) / (1000 * 60 * 60);

                console.log(`   Orden #${order.id}:`);
                console.log(`      Técnicos: ${order.technician_id}`);
                console.log(`      Inicio: ${order.start_date} ${order.start_time}`);
                console.log(`      Fin: ${order.end_date} ${order.end_time}`);
                console.log(`      Horas: ${hours.toFixed(2)} hrs`);
                console.log('');
            } else {
                console.log(`   ⚠️ Orden #${orderId} no encontrada\n`);
            }
        }

        // 2. Delete orders
        console.log('2. ELIMINANDO ÓRDENES...\n');
        for (const orderId of problematicOrderIds) {
            const [result] = await sequelize.query(`
                DELETE FROM "WorkOrders"
                WHERE id = :orderId
            `, {
                replacements: { orderId }
            });

            console.log(`   ✓ Orden #${orderId} eliminada`);
        }

        // 3. Verify deletion
        console.log('\n3. VERIFICACIÓN:\n');
        const [remainingOrders] = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM "WorkOrders"
            WHERE id IN (1, 10)
        `);

        if (remainingOrders[0].count === 0) {
            console.log('   ✓ Órdenes eliminadas correctamente');
        } else {
            console.log(`   ⚠️ Aún quedan ${remainingOrders[0].count} orden(es)`);
        }

        // 4. Recalculate man-hours to show new results
        console.log('\n4. NUEVO CÁLCULO DE HORAS-HOMBRE:\n');

        const [workOrders] = await sequelize.query(`
            SELECT 
                "technician_id",
                "start_date",
                "start_time",
                "end_date",
                "end_time"
            FROM "WorkOrders"
            WHERE 
                "start_date" IS NOT NULL 
                AND "end_date" IS NOT NULL
                AND "start_time" IS NOT NULL
                AND "end_time" IS NOT NULL
                AND "technician_id" IS NOT NULL
        `);

        const technicianHours = {};
        workOrders.forEach(wo => {
            const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
            const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
            const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

            // Skip negative hours (in case there are more)
            if (totalHours < 0) {
                return;
            }

            const technicians = wo.technician_id.split(',').map(t => t.trim());
            const hoursPerTech = totalHours / technicians.length;

            technicians.forEach(tech => {
                if (tech) {
                    technicianHours[tech] = (technicianHours[tech] || 0) + hoursPerTech;
                }
            });
        });

        const sortedTechs = Object.entries(technicianHours)
            .sort((a, b) => b[1] - a[1]);

        if (sortedTechs.length > 0) {
            sortedTechs.forEach(([tech, hours]) => {
                console.log(`   ${tech}: ${hours.toFixed(2)} hrs`);
            });
        } else {
            console.log('   (No hay datos de horas-hombre)');
        }

        console.log('\n✓ ELIMINACIÓN COMPLETADA');
        console.log('=== FIN ===');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

deleteProblematicOrders();
