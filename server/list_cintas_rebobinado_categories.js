const db = require('./src/config/db');

async function list() {
    try {
        const res = await db.query("SELECT DISTINCT asset_category FROM checklist_templates WHERE asset_category LIKE '%CINTAS%' OR asset_category LIKE '%REBOBIN%'");
        console.log('TARGET_CATEGORIES:');
        res.rows.forEach(r => console.log(r.asset_category));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
list();
