const db = require('./src/config/db');

async function removeRebobinadoItem() {
    try {
        const res = await db.query("SELECT id, name, items FROM checklist_templates WHERE asset_category = 'CINTAS_CORTADORAS'");
        
        console.log(`Checking ${res.rows.length} templates in CINTAS_CORTADORAS...`);

        for (const template of res.rows) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) continue;

            let changed = false;
            for (const section of items.sections) {
                if (section.rows) {
                    const initialCount = section.rows.length;
                    section.rows = section.rows.filter(r => 
                        !r.label.toLowerCase().includes('rebobinado de cinta cortada') &&
                        !r.id.toLowerCase().includes('rebobinado_cinta')
                    );
                    if (section.rows.length < initialCount) {
                        changed = true;
                        console.log(`- Removed item from ${template.name}`);
                    }
                }
            }

            if (changed) {
                await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
            }
        }

        console.log('\nCleanup completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

removeRebobinadoItem();
