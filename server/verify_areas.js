const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Plant, Area } = require('../models');

async function verifyAreas() {
    try {
        console.log('\n🔍 Verificando nombres de áreas...\n');

        // Obtener todas las plantas con sus áreas
        const plants = await Plant.findAll({
            include: [{
                model: Area,
                as: 'areas'
            }],
            order: [['name', 'ASC'], ['areas', 'name', 'ASC']]
        });

        plants.forEach(plant => {
            console.log(`\n📍 Planta: ${plant.name}`);
            console.log('─'.repeat(50));

            // Agrupar áreas únicas
            const uniqueAreas = [...new Set(plant.areas.map(a => a.name))];

            uniqueAreas.forEach(areaName => {
                console.log(`  ✓ ${areaName}`);
            });
        });

        console.log('\n✅ Verificación completada!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error verificando áreas:', error);
        process.exit(1);
    }
}

verifyAreas();
