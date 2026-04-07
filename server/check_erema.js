const db = require('./src/config/db');

async function check() {
    try {
        const m = await db.query("SELECT id, name FROM \"Machines\" WHERE name ILIKE '%erema%'");
        const t = await db.query("SELECT id, name FROM checklist_templates WHERE name ILIKE '%erema%'");
        console.log("Machines:");
        m.rows.forEach(x => console.log(x.id, x.name));
        console.log("Templates:");
        t.rows.forEach(x => console.log(x.id, x.name));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
