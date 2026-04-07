const { syncDatabase } = require('./src/models');
require('dotenv').config();

async function runSync() {
    try {
        console.log('Iniciando sincronización forzada...');
        await syncDatabase();
        console.log('Sincronización completada.');
        process.exit(0);
    } catch (error) {
        console.error('Error sincronizando:', error);
        process.exit(1);
    }
}

runSync();
