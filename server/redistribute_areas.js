const sequelize = require('./src/config/sequelize');

async function redistributeAreas() {
    try {
        await sequelize.authenticate();
        console.log('=== REDISTRIBUCIÓN DE ÁREAS ===\n');

        // Plant IDs
        const STRETCH_ID = 2;
        const RECICLAJE_ID = 3;

        // Define which areas belong to which plant
        const stretchAreas = ['EXTRUSION', 'REBOBINADO', 'PREESTIRADO', 'CINTAS'];
        const reciclajeAreas = ['LINEA BEIER', 'PELETIZADOR', 'PTAR'];
        const sharedAreas = ['SERV. AUX', 'SERV. GEN'];

        console.log('1. Eliminando áreas incorrectas...\n');

        // Delete STRETCH areas that should only be in RECICLAJE
        for (const areaName of reciclajeAreas) {
            const [result] = await sequelize.query(`
                DELETE FROM "Areas"
                WHERE name = :areaName AND "plantId" = :plantId
            `, {
                replacements: { areaName, plantId: STRETCH_ID }
            });
            console.log(`   ✓ Eliminada "${areaName}" de STRETCH`);
        }

        // Delete RECICLAJE areas that should only be in STRETCH
        for (const areaName of stretchAreas) {
            const [result] = await sequelize.query(`
                DELETE FROM "Areas"
                WHERE name = :areaName AND "plantId" = :plantId
            `, {
                replacements: { areaName, plantId: RECICLAJE_ID }
            });
            console.log(`   ✓ Eliminada "${areaName}" de RECICLAJE`);
        }

        console.log('\n2. Verificando áreas compartidas (deben existir en ambas)...\n');

        for (const areaName of sharedAreas) {
            // Check if exists in STRETCH
            const [stretchExists] = await sequelize.query(`
                SELECT id FROM "Areas" WHERE name = :areaName AND "plantId" = :plantId
            `, {
                replacements: { areaName, plantId: STRETCH_ID }
            });

            if (stretchExists.length === 0) {
                await sequelize.query(`
                    INSERT INTO "Areas" (name, "plantId", "createdAt", "updatedAt")
                    VALUES (:areaName, :plantId, NOW(), NOW())
                `, {
                    replacements: { areaName, plantId: STRETCH_ID }
                });
                console.log(`   ✓ Creada "${areaName}" en STRETCH`);
            } else {
                console.log(`   ✓ "${areaName}" ya existe en STRETCH`);
            }

            // Check if exists in RECICLAJE
            const [reciclajeExists] = await sequelize.query(`
                SELECT id FROM "Areas" WHERE name = :areaName AND "plantId" = :plantId
            `, {
                replacements: { areaName, plantId: RECICLAJE_ID }
            });

            if (reciclajeExists.length === 0) {
                await sequelize.query(`
                    INSERT INTO "Areas" (name, "plantId", "createdAt", "updatedAt")
                    VALUES (:areaName, :plantId, NOW(), NOW())
                `, {
                    replacements: { areaName, plantId: RECICLAJE_ID }
                });
                console.log(`   ✓ Creada "${areaName}" en RECICLAJE`);
            } else {
                console.log(`   ✓ "${areaName}" ya existe en RECICLAJE`);
            }
        }

        console.log('\n3. Verificando resultado final...\n');

        // Show final distribution
        const [finalAreas] = await sequelize.query(`
            SELECT a.name, p.name as plant_name
            FROM "Areas" a
            INNER JOIN "Plants" p ON a."plantId" = p.id
            ORDER BY p.name, a.name
        `);

        const stretchFinal = finalAreas.filter(a => a.plant_name === 'STRETCH');
        const reciclajeFinal = finalAreas.filter(a => a.plant_name === 'RECICLAJE');

        console.log('STRETCH (' + stretchFinal.length + ' áreas):');
        stretchFinal.forEach(a => console.log(`   - ${a.name}`));

        console.log('\nRECICLAJE (' + reciclajeFinal.length + ' áreas):');
        reciclajeFinal.forEach(a => console.log(`   - ${a.name}`));

        console.log('\n✓ REDISTRIBUCIÓN COMPLETADA');
        console.log('=== FIN ===');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

redistributeAreas();
