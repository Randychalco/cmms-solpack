const { WorkOrder, Inventory } = require('./src/models');
const db = require('./src/config/db');

// Mock req/res
const req = {
    body: {
        plant_id: 1,
        area_id: 1,
        machine_id: 41,
        order_class: 'CORRECTIVO',
        status: 'ABIERTA',
        priority: 'MEDIA'
    },
    user: { id: 1 }
};

const res = {
    status: (code) => { console.log('Status:', code); return res; },
    json: (data) => { console.log('JSON Output:', JSON.stringify(data, null, 2)); return res; }
};

// Paste the logic from workOrderController.js createWorkOrder here to test
const processMaterials = async (materialsData, action = 'deduct') => {
    if (!materialsData) return;
    try {
        const materials = typeof materialsData === 'string' ? JSON.parse(materialsData) : materialsData;
        if (!Array.isArray(materials)) return;
        for (const mat of materials) {
            const qty = parseFloat(mat.used_quantity || mat.quantity_requested || mat.quantity || 0);
            if (qty <= 0 || isNaN(qty)) continue;
            let item = null;
            const invId = mat.inventory_id || mat.id;
            if (invId && !isNaN(parseInt(invId))) item = await Inventory.findByPk(invId);
            if (!item && mat.sku) item = await Inventory.findOne({ where: { code: mat.sku } });
            if (item) {
                if (action === 'deduct') item.current_stock = Math.max(0, item.current_stock - qty);
                else if (action === 'restore') item.current_stock = item.current_stock + qty;
                await item.save();
            }
        }
    } catch (err) { console.error(`Error ${action}ing:`, err); }
};

async function test() {
    try {
        const { plant_id, area_id, machine_id, sub_machine_id, status, materials_used, material_request_ids } = req.body;
        const year = new Date().getFullYear();
        const lastOrder = await WorkOrder.findOne({ order: [['id', 'DESC']] });
        let sequence = 1;
        if (lastOrder && lastOrder.ticket_number) {
            const parts = lastOrder.ticket_number.split('-');
            if (parts.length === 3 && parts[1] === String(year)) sequence = parseInt(parts[2], 10) + 1;
        }
        const ticket_number = `OT-${year}-${String(sequence).padStart(4, '0')}`;
        console.log('Generating ticket:', ticket_number);

        const workOrder = await WorkOrder.create({
            ticket_number,
            plant_id: plant_id || null,
            area_id: area_id || null,
            machine_id: machine_id || null,
            order_class: 'CORRECTIVO',
            requester_id: req.user ? req.user.id : null,
            status: status || 'ABIERTA',
        });
        console.log('WO Created:', workOrder.id);
        
        // Clean up test WO
        await workOrder.destroy();
        console.log('Test successful');
    } catch (err) {
        console.error('FAILED:', err);
    }
    process.exit(0);
}

test();
