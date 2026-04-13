const { WorkOrder, Plant, Area, Machine, SubMachine, User, Inventory } = require('../models');
const db = require('../config/db');

// Helper to handle inventory deduction/restoration for multiple formats
const processMaterials = async (materialsData, action = 'deduct') => {
    if (!materialsData) return;
    try {
        const materials = typeof materialsData === 'string' ? JSON.parse(materialsData) : materialsData;
        if (!Array.isArray(materials)) return;
        
        for (const mat of materials) {
            const qty = parseFloat(mat.used_quantity || mat.quantity_requested || mat.quantity || 0);
            if (qty <= 0 || isNaN(qty)) continue;

            let item = null;
            // Material requests items usually have .id as inventory_id, 
            // direct materials have .inventory_id
            const invId = mat.inventory_id || mat.id;
            
            if (invId && !isNaN(parseInt(invId))) {
                item = await Inventory.findByPk(invId);
            }
            if (!item && mat.sku) {
                item = await Inventory.findOne({ where: { code: mat.sku } });
            }

            if (item) {
                if (action === 'deduct') {
                    item.current_stock = Math.max(0, item.current_stock - qty);
                } else if (action === 'restore') {
                    item.current_stock = item.current_stock + qty;
                }
                await item.save();
            }
        }
    } catch (err) {
        console.error(`Error ${action}ing inventory for materials:`, err);
    }
};


// @desc    Get all work orders with hierarchy
// @route   GET /api/work-orders
// @access  Private
const getWorkOrders = async (req, res) => {
    try {
        const workOrders = await WorkOrder.findAll({
            include: [
                { model: Plant, attributes: ['id', 'name'] },
                { model: Area, attributes: ['id', 'name'] },
                { model: Machine, attributes: ['id', 'name'] },
                { model: SubMachine, attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(workOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single work order by ID
// @route   GET /api/work-orders/:id
// @access  Private
const getWorkOrderById = async (req, res) => {
    try {
        const workOrder = await WorkOrder.findByPk(req.params.id, {
            include: [
                { model: Plant, attributes: ['id', 'name'] },
                { model: Area, attributes: ['id', 'name'] },
                { model: Machine, attributes: ['id', 'name'] },
                { model: SubMachine, attributes: ['id', 'name'] },
            ]
        });

        if (!workOrder) {
            return res.status(404).json({ message: 'Work order not found' });
        }

        res.json(workOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a new work order
// @route   POST /api/work-orders
// @access  Private
const createWorkOrder = async (req, res) => {
    try {
        const {
            plant_id,
            area_id,
            machine_id,
            sub_machine_id,
            equipment_condition,
            order_class,
            failure_description,
            failure_cause,
            action_taken,
            planning_group,
            technician_id,
            leader_technician_name,
            supervisor_name,
            start_date,
            start_time,
            end_date,
            end_time,
            materials_used,
            observations,
            priority,
            status,
            material_request_ids
        } = req.body;

        // Generate ticket number
        // Generate ticket number
        const year = new Date().getFullYear();
        const lastOrder = await WorkOrder.findOne({
            order: [['id', 'DESC']]
        });

        let sequence = 1;
        if (lastOrder && lastOrder.ticket_number) {
            const parts = lastOrder.ticket_number.split('-');
            if (parts.length === 3 && parts[1] === String(year)) {
                const lastSeq = parseInt(parts[2], 10);
                if (!isNaN(lastSeq)) {
                    sequence = lastSeq + 1;
                }
            }
        }

        const ticket_number = `OT-${year}-${String(sequence).padStart(4, '0')}`;

        console.log('--- CREATING OT ---');
        console.log('Tech Sig Length:', req.body.technician_signature ? req.body.technician_signature.length : 'NULL');
        console.log('Op Sig Length:', req.body.operator_signature ? req.body.operator_signature.length : 'NULL');

        // Create work order
        const workOrder = await WorkOrder.create({
            ticket_number,
            plant_id: plant_id || null,
            area_id: area_id || null,
            machine_id: machine_id || null,
            sub_machine_id: sub_machine_id || null,
            equipment_condition: equipment_condition || null,
            order_class: order_class || 'CORRECTIVO',
            failure_description: failure_description || null,
            failure_cause: failure_cause || null,
            action_taken: action_taken || null,
            planning_group: planning_group || null,
            requester_id: req.user ? req.user.id : null,
            technician_id: technician_id || null,
            leader_technician_name: leader_technician_name || null,
            supervisor_name: supervisor_name || null,
            start_date: start_date || null,
            start_time: start_time || null,
            end_date: end_date || null,
            end_time: end_time || null,
            materials_used: materials_used || null,
            observations: observations || null,
            status: status || 'ABIERTA',
            priority: priority || 'MEDIA',
            technician_signature: req.body.technician_signature || null,
            operator_signature: req.body.operator_signature || null,
        });

        // 1. Linked Material Requests
        if (material_request_ids && Array.isArray(material_request_ids) && material_request_ids.length > 0) {
            for (const reqId of material_request_ids) {
                try {
                    // Basic UUID validation check (if it's a string and has dashes)
                    if (typeof reqId !== 'string' || !reqId.includes('-')) continue;

                    const reqRow = await db.query('SELECT * FROM material_requests WHERE id = $1', [reqId]);
                    if (reqRow.rows.length > 0) {
                        let finalStatus = 'En Proceso';
                        if (status === 'CERRADA') {
                            finalStatus = 'Entregado';
                            await processMaterials(reqRow.rows[0].items, 'deduct');
                        }
                        await db.query(
                            'UPDATE material_requests SET wo_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                            [workOrder.id, finalStatus, reqId]
                        );
                    }
                } catch (reqErr) {
                    console.error(`Error linking material request ${reqId}:`, reqErr);
                }
            }
        }

        // 2. Direct Materials (materials_used)
        if (materials_used && status === 'CERRADA') {
            await processMaterials(materials_used, 'deduct');
        }

        // Fetch with relations
        const createdWorkOrder = await WorkOrder.findByPk(workOrder.id, {
            include: [
                { model: Plant, attributes: ['id', 'name'] },
                { model: Area, attributes: ['id', 'name'] },
                { model: Machine, attributes: ['id', 'name'] },
                { model: SubMachine, attributes: ['id', 'name'] },
            ]
        });

        res.status(201).json(createdWorkOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update work order
// @route   PUT /api/work-orders/:id
// @access  Private
const updateWorkOrder = async (req, res) => {
    try {
        const workOrder = await WorkOrder.findByPk(req.params.id);

        if (!workOrder) {
            return res.status(404).json({ message: 'Work order not found' });
        }

        const prevStatus = workOrder.status;
        const newStatus = req.body.status || prevStatus;

        // Update basic fields
        await workOrder.update(req.body);

        // Handle Material Requests Linked or Unlinked to this WO
        const { material_request_ids } = req.body;

        if (material_request_ids !== undefined) {
            try {
                const requestedIds = Array.isArray(material_request_ids) ? material_request_ids : [];

                const currentLinkedRes = await db.query(
                    'SELECT * FROM material_requests WHERE wo_id = $1',
                    [workOrder.id]
                );
                const currentLinkedRequests = currentLinkedRes.rows;
                const currentLinkedIds = currentLinkedRequests.map(r => r.id);

                // 1. Unlink requests that were unselected (Restore inventory)
                const idsToUnlink = currentLinkedIds.filter(id => !requestedIds.includes(id));
                if (idsToUnlink.length > 0) {
                    for (const reqId of idsToUnlink) {
                        const reqRow = currentLinkedRequests.find(r => r.id === reqId);
                        if (reqRow && reqRow.status === 'Entregado') {
                            await processMaterials(reqRow.items, 'restore');
                        }
                        await db.query(
                            `UPDATE material_requests SET wo_id = NULL, status = 'En Proceso', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                            [reqId]
                        );
                    }
                }

                // 2. Process newly selected requests OR existing ones if status changed to CERRADA
                for (const reqId of requestedIds) {
                    const isNew = !currentLinkedIds.includes(reqId);
                    const reqRowRes = await db.query('SELECT * FROM material_requests WHERE id = $1', [reqId]);
                    if (reqRowRes.rows.length === 0) continue;
                    const reqRow = reqRowRes.rows[0];

                    if (isNew) {
                        let finalStatus = 'En Proceso';
                        if (newStatus === 'CERRADA') {
                            finalStatus = 'Entregado';
                            await processMaterials(reqRow.items, 'deduct');
                        }
                        await db.query(
                            `UPDATE material_requests SET wo_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
                            [workOrder.id, finalStatus, reqId]
                        );
                    } else if (newStatus === 'CERRADA' && prevStatus !== 'CERRADA' && reqRow.status !== 'Entregado') {
                        // Order just closed and this request was already linked but not yet completed
                        await processMaterials(reqRow.items, 'deduct');
                        await db.query(
                            `UPDATE material_requests SET status = 'Entregado', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                            [reqId]
                        );
                    }
                }
            } catch (err) {
                console.error('Error updating material requests for WO:', err);
            }
        }

        // --- Handle direct materials deduction/restoration on status change ---
        if (newStatus === 'CERRADA' && prevStatus !== 'CERRADA') {
            await processMaterials(workOrder.materials_used, 'deduct');
        } else if (newStatus !== 'CERRADA' && prevStatus === 'CERRADA') {
            await processMaterials(workOrder.materials_used, 'restore');
        }

        // Fetch updated work order with relations
        const updatedWorkOrder = await WorkOrder.findByPk(workOrder.id, {
            include: [
                { model: Plant, attributes: ['id', 'name'] },
                { model: Area, attributes: ['id', 'name'] },
                { model: Machine, attributes: ['id', 'name'] },
                { model: SubMachine, attributes: ['id', 'name'] },
            ]
        });

        res.json(updatedWorkOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update work order status
// @route   PUT /api/work-orders/:id/status
// @access  Private
const updateWorkOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const workOrder = await WorkOrder.findByPk(req.params.id);

        if (!workOrder) {
            return res.status(404).json({ message: 'Work order not found' });
        }

        const prevStatus = workOrder.status;
        await workOrder.update({ status });

        // Handle Material Requests and Direct Materials based on state transition
        if (prevStatus !== 'CERRADA' && status === 'CERRADA') {
            // 1. Linked Material Requests (regardless of status, as long as linked)
            const linkedRequests = await db.query(
                "SELECT * FROM material_requests WHERE wo_id = $1",
                [workOrder.id]
            );
            for (const reqRow of linkedRequests.rows) {
                if (reqRow.status !== 'Completado') {
                    await processMaterials(reqRow.items, 'deduct');
                    await db.query("UPDATE material_requests SET status = 'Completado', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [reqRow.id]);
                }
            }

            // 2. Direct Materials
            await processMaterials(workOrder.materials_used, 'deduct');

        } else if (prevStatus === 'CERRADA' && status !== 'CERRADA') {
            // Restore inventory if order is re-opened
            
            // 1. Linked Material Requests
            const linkedRequests = await db.query(
                "SELECT * FROM material_requests WHERE wo_id = $1 AND status = 'Completado'",
                [workOrder.id]
            );
            for (const reqRow of linkedRequests.rows) {
                await processMaterials(reqRow.items, 'restore');
                await db.query("UPDATE material_requests SET status = 'Asignado', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [reqRow.id]);
            }

            // 2. Direct Materials
            await processMaterials(workOrder.materials_used, 'restore');
        }

        res.json(workOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add signature to work order
// @route   PUT /api/work-orders/:id/signature
// @access  Private
const addSignature = async (req, res) => {
    try {
        const { type, signature } = req.body; // type: 'technician' or 'operator'
        const workOrder = await WorkOrder.findByPk(req.params.id);

        if (!workOrder) {
            return res.status(404).json({ message: 'Work order not found' });
        }

        if (type === 'technician') {
            await workOrder.update({ technician_signature: signature });
        } else if (type === 'operator') {
            await workOrder.update({ operator_signature: signature });
        } else {
            return res.status(400).json({ message: 'Invalid signature type' });
        }

        res.json(workOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete work order
// @route   DELETE /api/work-orders/:id
// @access  Private
const deleteWorkOrder = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No autorizado. Solo los administradores pueden eliminar órdenes.' });
        }

        const workOrder = await WorkOrder.findByPk(req.params.id);

        if (!workOrder) {
            return res.status(404).json({ message: 'Work order not found' });
        }

        await workOrder.destroy();

        res.json({ message: 'Work order removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getWorkOrders,
    getWorkOrderById,
    createWorkOrder,
    updateWorkOrder,
    updateWorkOrderStatus,
    addSignature,
    deleteWorkOrder,
};
