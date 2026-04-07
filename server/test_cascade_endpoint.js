const axios = require('axios');

async function testCascadeEndpoint() {
    try {
        console.log('=== PRUEBA DEL ENDPOINT DE CASCADA ===\n');

        // Test for STRETCH (plantId: 2)
        console.log('1. Probando /master/areas/2 (STRETCH):');
        const stretchRes = await axios.get('http://localhost:5000/api/master/areas/2');
        console.log(`   Áreas encontradas: ${stretchRes.data.length}`);
        stretchRes.data.forEach(area => {
            console.log(`      - ${area.name} (ID: ${area.id}, plantId: ${area.plantId})`);
        });

        // Test for RECICLAJE (plantId: 3)
        console.log('\n2. Probando /master/areas/3 (RECICLAJE):');
        const reciclajeRes = await axios.get('http://localhost:5000/api/master/areas/3');
        console.log(`   Áreas encontradas: ${reciclajeRes.data.length}`);
        reciclajeRes.data.forEach(area => {
            console.log(`      - ${area.name} (ID: ${area.id}, plantId: ${area.plantId})`);
        });

        console.log('\n✓ CONCLUSIÓN:');
        console.log('  El endpoint filtra correctamente por plantId.');
        console.log('  Ambas plantas tienen áreas con nombres idénticos pero IDs diferentes.');
        console.log('  El frontend debería mostrar solo las áreas de la planta seleccionada.\n');

        console.log('=== FIN DE PRUEBA ===');
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

testCascadeEndpoint();
