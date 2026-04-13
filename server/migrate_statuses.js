const db = require('./src/config/db');

async function migrate() {
    try {
        await db.query("UPDATE material_requests SET status = 'Entregado' WHERE status = 'Completado'");
        await db.query("UPDATE material_requests SET status = 'En Proceso' WHERE status = 'Asignado'");
        console.log('Migration complete');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
