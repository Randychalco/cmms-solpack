const db = require('./src/config/db');

async function createMaterialRequestsTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS material_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                wo_id INTEGER REFERENCES work_orders(id) ON DELETE SET NULL,
                items JSONB NOT NULL DEFAULT '[]', -- [{ sku, description, quantity_requested }]
                status VARCHAR(50) DEFAULT 'En Proceso', -- En Proceso, Asignado, Completado, Rechazado
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Successfully created material_requests table.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating material_requests table:', error);
        process.exit(1);
    }
}

createMaterialRequestsTable();
