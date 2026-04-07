const db = require('./src/config/db');

async function verify() {
    try {
        const res = await db.query("SELECT name, items, asset_category FROM checklist_templates WHERE asset_category IN ('EXTRUSION_2_SML1', 'PELETIZADORA', 'PREESTIRADO') LIMIT 3");
        
        console.log('--- VERIFICATION RESULTS ---');
        res.rows.forEach(row => {
            const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
            const firstSection = items.sections ? items.sections[0] : null;
            console.log(`Template: ${row.name} (${row.asset_category})`);
            if (firstSection && firstSection.id === 'seguridad_operativa') {
                console.log(`  PASSED: Section 0 is ${firstSection.title}`);
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
