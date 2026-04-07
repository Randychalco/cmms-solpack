const db = require('./src/config/db');

async function findSiat() {
    try {
        const res = await db.query("SELECT id, name, asset_category, items FROM checklist_templates WHERE name ILIKE '%SIAT%' OR asset_category ILIKE '%SIAT%'");
        console.log('Found SIAT Templates:');
        res.rows.forEach(r => {
            console.log(`- ${r.name} (${r.asset_category}) ID: ${r.id}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
findSiat();
