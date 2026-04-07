const db = require('./src/config/db');

const runMigration = async () => {
    try {
        console.log('Iniciando migración...');

        // Agregar columna status
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
                    ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
                    -- Actualizar usuarios existentes a 'active' por defecto para no bloquearlos
                    UPDATE users SET status = 'active';
                END IF;
            END
            $$;
        `);

        console.log('Migración completada exitosamente.');
    } catch (error) {
        console.error('Error en migración:', error);
    } finally {
        process.exit();
    }
};

runMigration();
