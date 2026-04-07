const db = require('./src/config/db');

async function duplicateChecklists() {
    try {
        console.log('Fetching base Rebobinadora template...');

        // 1. Get the base template we just fixed
        const baseResult = await db.query(`
            SELECT items, layout, asset_category 
            FROM checklist_templates 
            WHERE name = 'RUTINA DE INSPECCION GENERAL - Rebobinadora'
            LIMIT 1
        `);

        if (baseResult.rows.length === 0) {
            console.error('Base template not found!');
            process.exit(1);
        }

        const baseTemplate = baseResult.rows[0];
        const machines = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];

        console.log(`Found base template. Creating clones for ${machines.join(', ')}...`);

        // 2. Loop and insert for each machine
        for (const machine of machines) {
            const newName = `RUTINA DE INSPECCION GENERAL - Rebobinadora ${machine}`;

            // Check if it already exists to avoid duplicates if run multiple times
            const exists = await db.query(`SELECT id FROM checklist_templates WHERE name = $1`, [newName]);

            if (exists.rows.length > 0) {
                console.log(`- Template '${newName}' already exists. Updating...`);
                await db.query(`
                    UPDATE checklist_templates
                    SET items = $1, layout = $2
                    WHERE name = $3
                `, [baseTemplate.items, baseTemplate.layout, newName]);
            } else {
                await db.query(`
                    INSERT INTO checklist_templates (name, asset_category, layout, items)
                    VALUES ($1, $2, $3, $4)
                `, [
                    newName,
                    baseTemplate.asset_category,
                    baseTemplate.layout,
                    baseTemplate.items // It's already JSON from the DB or a string, node-postgres handles both usually. If it fails, stringify it.
                ]);
                console.log(`- Created template: '${newName}'`);
            }
        }

        console.log('\nAll templates created successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error duplicating checklists:', error);
        process.exit(1);
    }
}

duplicateChecklists();
