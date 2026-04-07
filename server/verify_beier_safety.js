const db = require('./src/config/db');

async function verify() {
    try {
        const targetCategories = [
            'BEIER_TINA',
            'BEIER_EXPRIMIDOR',
            'BEIER_MOLINO',
            'BEIER_LAVADORA_FRICCION',
            'BEIER_HUSILLO',
            'BEIER_SILO',
            'BEIER_SOPLADOR',
            'BEIER_FAJA',
            'BEIER_TRITURADORA'
        ];

        const res = await db.query("SELECT name, items, asset_category FROM checklist_templates WHERE asset_category = ANY($1) LIMIT 10", [targetCategories]);
        
        console.log('--- BEIER VERIFICATION RESULTS ---');
        res.rows.forEach(row => {
            const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
            const firstSection = items.sections ? items.sections[0] : null;
            console.log(`Template: ${row.name} (${row.asset_category})`);
            if (firstSection && firstSection.id === 'seguridad_operativa') {
                const rows = firstSection.rows || [];
                console.log(`  PASSED: Section 0 is ${firstSection.title} with ${rows.length} items.`);
                if (rows.length !== 3) {
                    console.log(`  WARNING: Expected 3 items, found ${rows.length}.`);
                }
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
