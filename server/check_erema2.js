const db = require('./src/config/db');
const fs = require('fs');

async function check() {
    try {
        const m = await db.query("SELECT id, name FROM \"Machines\" WHERE name ILIKE '%erema%'");
        const t = await db.query("SELECT id, name FROM checklist_templates WHERE name ILIKE '%erema%'");

        fs.writeFileSync('erema_results.json', JSON.stringify({
            machines: m.rows,
            templates: t.rows
        }, null, 2));

        console.log('Done');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
