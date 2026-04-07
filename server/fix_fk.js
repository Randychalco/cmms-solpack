const db = require('./src/config/db');

async function fix() {
    try {
        console.log("Dropping old foreign key...");
        await db.query("ALTER TABLE material_requests DROP CONSTRAINT IF EXISTS material_requests_wo_id_fkey");
        
        console.log("Adding correct foreign key pointing to WorkOrders...");
        await db.query('ALTER TABLE material_requests ADD CONSTRAINT material_requests_wo_id_fkey FOREIGN KEY (wo_id) REFERENCES "WorkOrders"(id) ON DELETE SET NULL');

        console.log("Done!");
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
fix();
