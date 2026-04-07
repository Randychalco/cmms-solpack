const sequelize = require('./src/config/sequelize');

async function checkAreaPlantRelationships() {
    try {
        await sequelize.authenticate();
        console.log('=== VERIFICACIÓN ÁREA-PLANTA ===\n');

        // 1. Check all plants
        const [plants] = await sequelize.query(`
            SELECT id, name FROM "Plants" ORDER BY id
        `);

        console.log('1. PLANTAS EN EL SISTEMA:');
        plants.forEach(p => {
            console.log(`   ID: ${p.id} - ${p.name}`);
        });

        // 2. Check all areas and their plantId
        const [areas] = await sequelize.query(`
            SELECT a.id, a.name, a."plantId", p.name as plant_name
            FROM "Areas" a
            LEFT JOIN "Plants" p ON a."plantId" = p.id
            ORDER BY a."plantId", a.name
        `);

        console.log('\n2. ÁREAS Y SUS PLANTAS ASIGNADAS:');
        areas.forEach(a => {
            const plantInfo = a.plantId ? `Planta ID ${a.plantId} (${a.plant_name})` : '❌ SIN PLANTA ASIGNADA';
            console.log(`   "${a.name}" -> ${plantInfo}`);
        });

        // 3. Check areas without plantId
        const areasWithoutPlant = areas.filter(a => !a.plantId);
        if (areasWithoutPlant.length > 0) {
            console.log('\n⚠️ PROBLEMA DETECTADO:');
            console.log(`   ${areasWithoutPlant.length} área(s) sin planta asignada:`);
            areasWithoutPlant.forEach(a => {
                console.log(`   - "${a.name}"`);
            });
        } else {
            console.log('\n✓ Todas las áreas tienen planta asignada');
        }

        // 4. Group areas by plant
        console.log('\n3. ÁREAS AGRUPADAS POR PLANTA:');
        plants.forEach(plant => {
            const plantAreas = areas.filter(a => a.plantId === plant.id);
            console.log(`\n   ${plant.name} (ID: ${plant.id}):`);
            if (plantAreas.length > 0) {
                plantAreas.forEach(a => console.log(`      - ${a.name}`));
            } else {
                console.log('      (sin áreas asignadas)');
            }
        });

        console.log('\n=== FIN VERIFICACIÓN ===');
        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAreaPlantRelationships();
