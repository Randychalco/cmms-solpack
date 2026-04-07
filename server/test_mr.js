const db = require('./src/config/db');
const { Inventory } = require('./src/models');

async function testLogic() {
    try {
        console.log("Fetching pending material requests...");
        const pending = await db.query("SELECT * FROM material_requests WHERE status='En Proceso' OR status='Asignado'");
        
        console.log(`Found ${pending.rows.length} pending requests.`);
        
        for (const reqRow of pending.rows) {
            console.log(`Processing MR ${reqRow.id}`);
            const items = typeof reqRow.items === 'string' ? JSON.parse(reqRow.items) : reqRow.items;
            
            for (const reqItem of items) {
                console.log(`  Processing item SKU: ${reqItem.sku}, ID: ${reqItem.id}, Qty: ${reqItem.quantity_requested}`);
                try {
                    let invItem = null;
                    if (reqItem.id) {
                        invItem = await Inventory.findByPk(reqItem.id);
                    }
                    if (!invItem && reqItem.sku) {
                        invItem = await Inventory.findOne({ where: { code: reqItem.sku } });
                    }
                    
                    if (invItem) {
                        console.log(`    Found inventory item ${invItem.id}, current stock: ${invItem.current_stock}`);
                        const q = parseFloat(reqItem.quantity_requested);
                        if (!isNaN(q)) {
                            invItem.current_stock = Math.max(0, invItem.current_stock - q);
                            await invItem.save();
                            console.log(`    Successfully saved new stock: ${invItem.current_stock}`);
                        } else {
                            console.log(`    Quantity is NaN`);
                        }
                    } else {
                        console.log(`    WARNING: Item not found in inventory!`);
                    }
                } catch (err) {
                    console.error(`    ERROR while processing item:`, err);
                }
            }
            
            console.log(`  Would mark ${reqRow.id} as Completado...`);
        }
        
    } catch(err) {
        console.error("Global error:", err);
    } finally {
        process.exit(0);
    }
}

testLogic();
