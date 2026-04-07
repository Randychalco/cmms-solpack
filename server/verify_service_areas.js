const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sequelize = require('./src/config/sequelize');

async function verifyAreas() {
    try {
        console.log('\n🔍 Verificando nombres de áreas en la base de datos...\n');

        // Query directo SQL para verificar las áreas
        const [results] = await sequelize.query(`
            SELECT DISTINCT p.name as planta, a.name as area
            FROM "Areas" a
            LEFT JOIN "Plants" p ON a."plantId" = p.id
            WHERE a.name LIKE '%SERV.%'
            ORDER BY p.name, a.name
        `);

        console.log('Áreas de servicios encontradas:\n');
        console.log('─'.repeat(60));

        let currentPlant = '';
        results.forEach(row => {
            if (row.planta !== currentPlant) {
                currentPlant = row.planta;
                console.log(`\n📍 ${row.planta}:`);
            }
            console.log(`   ✓ ${row.area}`);
        });

        console.log('\n' + '─'.repeat(60));
        console.log(`\nTotal de áreas de servicio: ${results.length}`);
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
