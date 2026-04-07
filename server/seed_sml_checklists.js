require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const itemsComunes = [
    { label: 'Verificar nivel de aceite', type: 'bool' },
    { label: 'Verificar temperatura de fusión', type: 'text' },
    { label: 'Verificar presión de cabezal (bar)', type: 'text' },
    { label: 'Revisar sistema de refrigeración', type: 'bool' },
    { label: 'Verificar velocidad de extrusión (rpm)', type: 'text' },
    { label: 'Revisar estado de válvulas y conexiones', type: 'bool' },
    { label: 'Limpiar filtros de malla', type: 'bool' },
    { label: 'Verificar estado del husillo', type: 'bool' },
    { label: 'Revisar sistema eléctrico y panel de control', type: 'bool' },
    { label: 'Observaciones generales', type: 'text' },
];

async function run() {
    const client = await pool.connect();
    try {
        // Check if templates already exist
        const existing = await client.query(
            "SELECT id, name FROM checklist_templates WHERE asset_category IN ('EXTRUSION_2_SML1', 'EXTRUSION_2_SML2')"
        );
        if (existing.rows.length > 0) {
            console.log('Plantillas ya existen:', existing.rows.map(r => r.name).join(', '));
            return;
        }

        // Insert SML 1 template
        await client.query(
            'INSERT INTO checklist_templates (name, asset_category, items) VALUES ($1, $2, $3)',
            ['Checklist Diario SML 1', 'EXTRUSION_2_SML1', JSON.stringify(itemsComunes)]
        );
        console.log('✅ Plantilla SML 1 creada');

        // Insert SML 2 template
        await client.query(
            'INSERT INTO checklist_templates (name, asset_category, items) VALUES ($1, $2, $3)',
            ['Checklist Diario SML 2', 'EXTRUSION_2_SML2', JSON.stringify(itemsComunes)]
        );
        console.log('✅ Plantilla SML 2 creada');

        // Verify
        const result = await client.query(
            "SELECT id, name, asset_category FROM checklist_templates WHERE asset_category IN ('EXTRUSION_2_SML1', 'EXTRUSION_2_SML2')"
        );
        console.log('Plantillas en BD:', result.rows);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
