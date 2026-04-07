const db = require('./src/config/db');

async function verify() {
    try {
        const targetCategories = [
            'CINTAS_CORTADORAS',
            'CINTAS_IMPRESORAS',
            'REBOBINADO'
        ];

        const res = await db.query("SELECT name, items, asset_category FROM checklist_templates WHERE asset_category = ANY($1)", [targetCategories]);
        
        console.log('--- CINTAS/REBOBINADO VERIFICATION RESULTS ---');
        res.rows.forEach(row => {
            const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
            const firstSection = items.sections ? items.sections[0] : null;
            console.log(`Template: ${row.name} (${row.asset_category})`);
            if (firstSection && firstSection.id === 'seguridad_operativa') {
                const rows = firstSection.rows || [];
                console.log(`  PASSED: Section 0 is ${firstSection.title} with ${rows.length} items.`);
            } else {
                console.log(`  FAILED: Section 0 is ${firstSection ? firstSection.title : 'MISSING'}`);
            }
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
verify();
