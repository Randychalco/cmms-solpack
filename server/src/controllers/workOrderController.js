const { WorkOrder, Plant, Area, Machine, SubMachine, User, Inventory } = require('../models');
const db = require('../config/db');

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
                sequence = parseInt(parts[2], 10) + 1;
            }
        }

        const ticket_number = `OT-${year}-${String(sequence).padStart(4, '0')}`;

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
            requester_id: req.user.id,
            technician_id: technician_id || null,
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

        // Deduct Stock from Inventory
        if (materials_used) {
            try {
                let materials = [];
                if (typeof materials_used === 'string') {
                    materials = JSON.parse(materials_used);
                } else {
                    materials = materials_used;
                }

                for (const mat of materials) {
                    if (mat.quantity) {
                        let item = null;
                        if (mat.inventory_id) {
                            item = await Inventory.findByPk(mat.inventory_id);
                        }
                        if (!item && mat.sku) {
                            item = await Inventory.findOne({ where: { code: mat.sku } });
                        }
                        
                        if (item) {
                            const quantityUsed = parseFloat(mat.quantity);
                            if (!isNaN(quantityUsed)) {
                                item.current_stock = Math.max(0, item.current_stock - quantityUsed);
                                await item.save();
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Error deducting stock from direct materials:', err);
            }
        }

        // Handle Material Requests Linked to this WO
        if (material_request_ids && material_request_ids.length > 0) {
            try {
                // Fetch the requests
                const requestsResult = await db.query(
                    'SELECT * FROM material_requests WHERE id = ANY($1::uuid[])',
                    [material_request_ids]
                );

                for (const reqRow of requestsResult.rows) {
                    const items = typeof reqRow.items === 'string' ? JSON.parse(reqRow.items) : reqRow.items;
                    let finalStatus = 'Asignado';

                    if (workOrder.status === 'CERRADA') {
                        finalStatus = 'Completado';
                        // Deduct inventory
                        for (const reqItem of items) {
                            if (reqItem.quantity_requested) {
                                let invItem = null;
                                if (reqItem.id) {
                                    invItem = await Inventory.findByPk(reqItem.id);
                                }
                                if (!invItem && reqItem.sku) {
                                    invItem = await Inventory.findOne({ where: { code: reqItem.sku } });
                                }

                                if (invItem) {
                                    const q = parseFloat(reqItem.quantity_requested);
                                    if (!isNaN(q)) {
                                        invItem.current_stock = Math.max(0, invItem.current_stock - q);
                                        await invItem.save();
                                    }
                                } else {
                                    console.warn(`Item not found during Work Order material deduction: ID ${reqItem.id}, SKU: ${reqItem.sku}`);
                                }
                            }
                        }
                    }

                    // Mark request as Asignado/Completado and link WO
                    await db.query(
                        `UPDATE material_requests 
                         SET status = $3, wo_id = $1, updated_at = CURRENT_TIMESTAMP 
                         WHERE id = $2`,
                        [workOrder.id, reqRow.id, finalStatus]
                    );
                }
            } catch (err) {
                console.error('Error processing material requests for WO:', err);
            }
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

        // Update fields
        await workOrder.update(req.body);

        // Handle Material Requests Linked or Unlinked to this WO
        const { material_request_ids } = req.body;

        if (material_request_ids !== undefined) {
            try {
                const requestedIds = Array.isArray(material_request_ids) ? material_request_ids : [];

                // 1. Find currently linked requests for this WO
                const currentLinkedRes = await db.query(
                    'SELECT id FROM material_requests WHERE wo_id = $1',
                    [workOrder.id]
                );
                const currentLinkedIds = currentLinkedRes.rows.map(r => r.id);

                // 2. Unlink requests that were unselected (Restore inventory)
                const idsToUnlink = currentLinkedIds.filter(id => !requestedIds.includes(id));
                if (idsToUnlink.length > 0) {
                    // Restore inventory
                    const requestsToUnlink = await db.query(
                        'SELECT * FROM material_requests WHERE id = ANY($1::uuid[])',
                        [idsToUnlink]
                    );

                    for (const reqRow of requestsToUnlink.rows) {
                        // Only restore if it was previously completed and discounted
                        if (reqRow.status === 'Completado') {
                            const items = typeof reqRow.items === 'string' ? JSON.parse(reqRow.items) : reqRow.items;
                            for (const reqItem of items) {
                                if (reqItem.quantity_requested) {
                                    let invItem = null;
                                    if (reqItem.id) {
                                        invItem = await Inventory.findByPk(reqItem.id);
                                    }
                                    if (!invItem && reqItem.sku) {
                                        invItem = await Inventory.findOne({ where: { code: reqItem.sku } });
                                    }
                                    
                                    if (invItem) {
                                        const q = parseFloat(reqItem.quantity_requested);
                                        if (!isNaN(q)) {
                                            // Restore stock
                                            invItem.current_stock = invItem.current_stock + q;
                                            await invItem.save();
                                        }
                                    }
                                }
                            }
                        }
                    }

                    await db.query(
                        `UPDATE material_requests SET wo_id = NULL, status = 'En Proceso' WHERE id = ANY($1::uuid[])`,
                        [idsToUnlink]
                    );
                }

                // 3. Process newly selected requests
                const idsToAdd = requestedIds.filter(id => !currentLinkedIds.includes(id));

                if (idsToAdd.length > 0) {
                    const requestsToAdd = await db.query(
                        'SELECT * FROM material_requests WHERE id = ANY($1::uuid[]) AND status != \'Completado\'',
                        [idsToAdd]
                    );

                    for (const reqRow of requestsToAdd.rows) {
                        const items = typeof reqRow.items === 'string' ? JSON.parse(reqRow.items) : reqRow.items;
                        let finalStatus = 'Asignado';

                        if (workOrder.status === 'CERRADA') {
                            finalStatus = 'Completado';
                            // Deduct inventory
                            for (const reqItem of items) {
                                if (reqItem.quantity_requested) {
                                    let invItem = null;
                                    if (reqItem.id) {
                                        invItem = await Inventory.findByPk(reqItem.id);
                                    }
                                    if (!invItem && reqItem.sku) {
                                        invItem = await Inventory.findOne({ where: { code: reqItem.sku } });
                                    }
                                    
                                    if (invItem) {
                                        const q = parseFloat(reqItem.quantity_requested);
                                        if (!isNaN(q)) {
                                            invItem.current_stock = Math.max(0, invItem.current_stock - q);
                                            await invItem.save();
                                        }
                                    } else {
                                        console.warn(`Item not found during Work Order update material deduction: ID ${reqItem.id}, SKU: ${reqItem.sku}`);
                                    }
                                }
                            }
                        }

                        // Mark request as Asignado/Completado and link WO
                        await db.query(
                            `UPDATE material_requests 
                             SET status = $3, wo_id = $1, updated_at = CURRENT_TIMESTAMP 
                             WHERE id = $2`,
                            [workOrder.id, reqRow.id, finalStatus]
                        );
                    }
                }
            } catch (err) {
                console.error('Error updating material requests for WO:', err);
            }
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

        // Handle Material Requests based on state transition
        if (prevStatus !== 'CERRADA' && status === 'CERRADA') {
            const linkedRequests = await db.query(
                "SELECT * FROM material_requests WHERE wo_id = $1 AND status = 'Asignado'",
                [workOrder.id]
            );
            for (const reqRow of linkedRequests.rows) {
                const items = typeof reqRow.items === 'string' ? JSON.parse(reqRow.items) : reqRow.items;
                for (const reqItem of items) {
                    if (reqItem.quantity_requested) {
                        let invItem = null;
                        if (reqItem.id) invItem = await Inventory.findByPk(reqItem.id);
                        if (!invItem && reqItem.sku) invItem = await Inventory.findOne({ where: { code: reqItem.sku } });
                        if (invItem) {
                            const q = parseFloat(reqItem.quantity_requested);
                            if (!isNaN(q)) {
                                invItem.current_stock = Math.max(0, invItem.current_stock - q);
                                await invItem.save();
                            }
                        }
                    }
                }
                await db.query("UPDATE material_requests SET status = 'Completado' WHERE id = $1", [reqRow.id]);
            }
        } else if (prevStatus === 'CERRADA' && status !== 'CERRADA') {
            const linkedRequests = await db.query(
                "SELECT * FROM material_requests WHERE wo_id = $1 AND status = 'Completado'",
                [workOrder.id]
            );
            for (const reqRow of linkedRequests.rows) {
                const items = typeof reqRow.items === 'string' ? JSON.parse(reqRow.items) : reqRow.items;
                for (const reqItem of items) {
                    if (reqItem.quantity_requested) {
                        let invItem = null;
                        if (reqItem.id) invItem = await Inventory.findByPk(reqItem.id);
                        if (!invItem && reqItem.sku) invItem = await Inventory.findOne({ where: { code: reqItem.sku } });
                        if (invItem) {
                            const q = parseFloat(reqItem.quantity_requested);
                            if (!isNaN(q)) {
                                invItem.current_stock = invItem.current_stock + q;
                                await invItem.save();
                            }
                        }
                    }
                }
                await db.query("UPDATE material_requests SET status = 'Asignado' WHERE id = $1", [reqRow.id]);
            }
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
