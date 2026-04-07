const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sequelize = require('./src/config/sequelize');
const { Plant, Area } = require('./src/models');

async function verifyAreas() {
    try {
        console.log('\n🔍 Verificando nombres de áreas...\n');

        // Obtener todas las áreas
        const areas = await Area.findAll({
            include: [{
                model: Plant,
                as: 'plant',
                attributes: ['name']
            }],
            order: [['name', 'ASC']]
        });

        // Agrupar por planta
        const areasByPlant = {};
        areas.forEach(area => {
            const plantName = area.plant?.name || 'Sin Planta';
            if (!areasByPlant[plantName]) {
                areasByPlant[plantName] = new Set();
            }
            areasByPlant[plantName].add(area.name);
        });

        // Mostrar resultados
        Object.keys(areasByPlant).sort().forEach(plantName => {
            console.log(`\n📍 Planta: ${plantName}`);
            console.log('─'.repeat(50));

            const uniqueAreas = Array.from(areasByPlant[plantName]).sort();
            uniqueAreas.forEach(areaName => {
                console.log(`  ✓ ${areaName}`);
            });
        });

        console.log('\n✅ Verificación completada!\n');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error verificando áreas:', error);
        await sequelize.close();
        process.exit(1);
    }
}

verifyAreas();
