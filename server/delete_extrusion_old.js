const db = require('./src/config/db');

async function clean() {
    try {
        await db.query("DELETE FROM checklist_templates WHERE name LIKE '%Extrusora Erema%'");
        console.log('Cleaned old Extrusora Erema templates');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
clean();
