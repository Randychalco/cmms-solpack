const db = require('./src/config/db');

const runMigration = async () => {
    try {
        console.log('Iniciando migración de timestamps...');

        // Agregar default NOW() a created_at y updated_at si existen
        await db.query(`
            ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();
            ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT NOW();
        `);

        console.log('Migración completada exitosamente.');
    } catch (error) {
        console.error('Error en migración:', error);
    } finally {
        process.exit();
    }
};

runMigration();
