const { updateWorkOrder } = require('./src/controllers/workOrderController');
const { WorkOrder } = require('./src/models');
const db = require('./src/config/db');

async function run() {
    try {
        console.log("Fetching a WorkOrder...");
        const wo = await WorkOrder.findOne({ order: [['id', 'DESC']] });
        if(!wo) return console.log("No WO found");
        console.log(`WO ID: ${wo.id}, Status: ${wo.status}`);

        console.log("Fetching an unassigned MaterialRequest...");
        const mrReq = await db.query("SELECT id FROM material_requests WHERE status='En Proceso' LIMIT 1");
        if(mrReq.rows.length === 0) return console.log("No MR found");
        const mrId = mrReq.rows[0].id;
        console.log(`MR ID: ${mrId}`);

        const req = {
            params: { id: wo.id },
            body: {
                status: wo.status,
                material_request_ids: [mrId]
            }
        };

        const res = {
            json: (data) => console.log("Success JSON:", data.id),
            status: (code) => ({ json: (d) => console.log(`Error ${code}:`, d) })
        };

        console.log("Calling updateWorkOrder...");
        await updateWorkOrder(req, res);
        console.log("Finished. Checking DB for MR status...");
        
        const check = await db.query("SELECT status, wo_id FROM material_requests WHERE id = $1", [mrId]);
        console.log("New MR state:", check.rows[0]);

        process.exit(0);
    } catch(e) {
        console.error("Error!!!", e);
        process.exit(1);
    }
}
run();
