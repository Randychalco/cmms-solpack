const sequelize = require('./src/config/sequelize');

async function analyzeManHours() {
    try {
        await sequelize.authenticate();
        console.log('=== ANÁLISIS DE HORAS-HOMBRE ===\n');

        // 1. Check work orders with complete time data
        const [workOrders] = await sequelize.query(`
            SELECT 
                id,
                "technician_id",
                "start_date",
                "start_time",
                "end_date",
                "end_time",
                "order_class",
                "equipment_condition"
            FROM "WorkOrders"
            WHERE 
                "start_date" IS NOT NULL 
                AND "end_date" IS NOT NULL
                AND "start_time" IS NOT NULL
                AND "end_time" IS NOT NULL
                AND "technician_id" IS NOT NULL
            ORDER BY "start_date" DESC
            LIMIT 20
        `);

        console.log(`1. ÓRDENES CON DATOS COMPLETOS: ${workOrders.length}\n`);

        if (workOrders.length === 0) {
            console.log('❌ No hay órdenes con datos completos de tiempo y técnico');
            await sequelize.close();
            return;
        }

        // 2. Calculate hours for sample orders
        console.log('2. EJEMPLOS DE CÁLCULO:\n');
        workOrders.slice(0, 5).forEach((wo, index) => {
            const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
            const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
            const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

            const technicians = wo.technician_id.split(',').map(t => t.trim());
            const hoursPerTech = totalHours / technicians.length;

            console.log(`Orden #${wo.id}:`);
            console.log(`   Inicio: ${wo.start_date} ${wo.start_time}`);
            console.log(`   Fin: ${wo.end_date} ${wo.end_time}`);
            console.log(`   Total horas: ${totalHours.toFixed(2)} hrs`);
            console.log(`   Técnicos: ${technicians.join(', ')}`);
            console.log(`   Horas por técnico: ${hoursPerTech.toFixed(2)} hrs\n`);
        });

        // 3. Calculate total hours by technician (replicating controller logic)
        const technicianHours = {};
        workOrders.forEach(wo => {
            const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
            const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
            const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

            const technicians = wo.technician_id.split(',').map(t => t.trim());
            const hoursPerTech = totalHours / technicians.length;

            technicians.forEach(tech => {
                if (tech) {
                    technicianHours[tech] = (technicianHours[tech] || 0) + hoursPerTech;
                }
            });
        });

        console.log('3. TOTAL HORAS POR TÉCNICO:\n');
        const sortedTechs = Object.entries(technicianHours)
            .sort((a, b) => b[1] - a[1]);

        sortedTechs.forEach(([tech, hours]) => {
            console.log(`   ${tech}: ${hours.toFixed(2)} hrs`);
        });

        // 4. Check for potential issues
        console.log('\n4. VERIFICACIÓN DE POSIBLES PROBLEMAS:\n');

        // Check for negative hours
        const negativeHours = workOrders.filter(wo => {
            const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
            const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
            return endDateTime < startDateTime;
        });

        if (negativeHours.length > 0) {
            console.log(`   ⚠️ ${negativeHours.length} órden(es) con horas negativas (fin antes del inicio)`);
            negativeHours.forEach(wo => {
                console.log(`      - Orden #${wo.id}: ${wo.start_date} ${wo.start_time} → ${wo.end_date} ${wo.end_time}`);
            });
        } else {
            console.log('   ✓ No hay órdenes con horas negativas');
        }

        // Check for very long duration (>24 hours)
        const longDuration = workOrders.filter(wo => {
            const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
            const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
            const hours = (endDateTime - startDateTime) / (1000 * 60 * 60);
            return hours > 24;
        });

        if (longDuration.length > 0) {
            console.log(`\n   ⚠️ ${longDuration.length} órden(es) con duración >24 horas`);
            longDuration.slice(0, 5).forEach(wo => {
                const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
                const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
                const hours = (endDateTime - startDateTime) / (1000 * 60 * 60);
                console.log(`      - Orden #${wo.id}: ${hours.toFixed(2)} hrs`);
            });
        } else {
            console.log('   ✓ No hay órdenes con duración excesiva');
        }

        // Check for empty technician names
        const emptyTechs = workOrders.filter(wo => {
            const technicians = wo.technician_id.split(',').map(t => t.trim());
            return technicians.some(t => !t);
        });

        if (emptyTechs.length > 0) {
            console.log(`\n   ⚠️ ${emptyTechs.length} órden(es) con nombres de técnicos vacíos en la lista`);
        } else {
            console.log('   ✓ Todos los técnicos tienen nombres válidos');
        }

        console.log('\n=== FIN DEL ANÁLISIS ===');
        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

analyzeManHours();
