const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sequelize = require('./src/config/sequelize');
const { Area } = require('./src/models');

async function deleteOldServiceAreas() {
    try {
        console.log('\n🗑️  Eliminando áreas de servicios antiguas...\n');

        // Eliminar áreas con nombres exactos "SERV. AUX" y "SERV. GEN" (sin sufijos)
        const areasToDelete = ['SERV. AUX', 'SERV. GEN'];

        for (const areaName of areasToDelete) {
            const deletedCount = await Area.destroy({
                where: {
                    name: areaName
                }
            });

            if (deletedCount > 0) {
                console.log(`✓ Eliminadas ${deletedCount} área(s) "${areaName}"`);
            } else {
                console.log(`ℹ No se encontraron áreas "${areaName}"`);
            }
        }

        console.log('\n✅ Limpieza completada!\n');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error eliminando áreas:', error);
        await sequelize.close();
        process.exit(1);
    }
}

deleteOldServiceAreas();
