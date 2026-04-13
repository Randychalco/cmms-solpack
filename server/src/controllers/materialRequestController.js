const db = require('../config/db');
const { Inventory } = require('../models');

// Helper to handle inventory deduction/restoration (Synchronized with workOrderController)
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

// Get all material requests
exports.getMaterialRequests = async (req, res) => {
    try {
        const { status, wo_id } = req.query;
        let query = `
            SELECT mr.*, u.name as user_name, m.name as machine_name
            FROM material_requests mr
            LEFT JOIN users u ON mr.user_id = u.id
            LEFT JOIN "Machines" m ON mr.machine_id = m.id
        `;
        const queryParams = [];
        const conditions = [];

        if (status) {
            // Support comma-separated statuses: e.g. "En Proceso,Asignado"
            const statuses = status.split(',').map(s => s.trim());
            if (statuses.length === 1) {
                conditions.push(`mr.status = $${queryParams.length + 1}`);
                queryParams.push(statuses[0]);
            } else {
                conditions.push(`mr.status = ANY($${queryParams.length + 1}::text[])`);
                queryParams.push(statuses);
            }
        }

        if (wo_id) {
            conditions.push(`mr.wo_id = $${queryParams.length + 1}`);
            queryParams.push(wo_id);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        query += ` ORDER BY mr.created_at DESC`;

        const result = await db.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching material requests:', error);
        res.status(500).json({ message: 'Error fetching material requests' });
    }
};

// Create a new material request
exports.createMaterialRequest = async (req, res) => {
    try {
        console.log('Incoming Material Request Payload:', req.body);
        const { items, notes, machine_id } = req.body;
        const userId = req.user.id; // from auth middleware

        if (!items || !items.length) {
            return res.status(400).json({ message: 'Items are required.' });
        }

        const result = await db.query(
            `INSERT INTO material_requests (user_id, items, notes, status, machine_id) 
             VALUES ($1, $2, $3, 'En Proceso', $4) RETURNING *`,
            [userId, JSON.stringify(items), notes || '', machine_id || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating material request:', error);
        res.status(500).json({ message: `Error creating material request: ${error.message}` });
    }
};

// Update status or attach to WO
exports.updateMaterialRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, wo_id } = req.body;

        const requestCheck = await db.query('SELECT * FROM material_requests WHERE id = $1', [id]);
        if (requestCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Material request not found' });
        }

        const prevStatus = requestCheck.rows[0].status;
        const newStatus = status;

        // Inventory deduction/restoration on manual status change
        if (newStatus === 'Entregado' && prevStatus !== 'Entregado') {
            await processMaterials(requestCheck.rows[0].items, 'deduct');
        } else if (newStatus !== 'Entregado' && prevStatus === 'Entregado') {
            await processMaterials(requestCheck.rows[0].items, 'restore');
        }

        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;

        if (status !== undefined) {
            updateFields.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        if (wo_id !== undefined) {
            updateFields.push(`wo_id = $${paramIndex}`);
            queryParams.push(wo_id);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        queryParams.push(id);
        const query = `
            UPDATE material_requests 
            SET ${updateFields.join(', ')} 
            WHERE id = $${paramIndex} 
            RETURNING *
        `;

        const result = await db.query(query, queryParams);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating material request:', error);
        res.status(500).json({ message: 'Error updating material request' });
    }
};

// Delete a material request
exports.deleteMaterialRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM material_requests WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Material request not found' });
        }

        res.json({ message: 'Material request deleted successfully' });
    } catch (error) {
        console.error('Error deleting material request:', error);
        res.status(500).json({ message: 'Error deleting material request' });
    }
};
