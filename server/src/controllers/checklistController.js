const db = require('../config/db');

// @desc    Get all checklist templates
// @route   GET /api/checklists/templates
// @access  Private
const getTemplates = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM checklist_templates');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a checklist template
// @route   POST /api/checklists/templates
// @access  Private (Admin)
const createTemplate = async (req, res) => {
    const { name, asset_category, items } = req.body;

    try {
        const newTemplate = await db.query(
            'INSERT INTO checklist_templates (name, asset_category, items) VALUES ($1, $2, $3) RETURNING *',
            [name, asset_category, JSON.stringify(items)]
        );
        res.status(201).json(newTemplate.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get execution by WO ID
// @route   GET /api/checklists/execution/wo/:woId
// @access  Private
const getExecutionByWO = async (req, res) => {
    const { woId } = req.params;
    try {
        const result = await db.query(`
            SELECT ce.*, u.name as executed_by_name 
            FROM checklist_executions ce 
            LEFT JOIN users u ON ce.executed_by = u.id 
            WHERE ce.wo_id = $1
        `, [woId]);
        if (result.rows.length === 0) return res.json(null);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get execution by execution ID
// @route   GET /api/checklists/execution/:id
// @access  Private
const getExecutionById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT ce.*, ct.name as template_name, wo.ticket_number, u.name as executed_by_name
            FROM checklist_executions ce
            LEFT JOIN checklist_templates ct ON ce.template_id = ct.id
            LEFT JOIN work_orders wo ON ce.wo_id = wo.id
            LEFT JOIN users u ON ce.executed_by = u.id
            WHERE ce.id = $1
        `, [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Execution not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all executions (History)
// @route   GET /api/checklists/executions
// @access  Private
const getExecutions = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                ce.id, ce.date, ce.overall_status, ce.observation,
                ct.name as template_name,
                wo.ticket_number, wo.id as wo_id,
                u.name as executed_by_name
            FROM checklist_executions ce
            LEFT JOIN checklist_templates ct ON ce.template_id = ct.id
            LEFT JOIN work_orders wo ON ce.wo_id = wo.id
            LEFT JOIN users u ON ce.executed_by = u.id
            ORDER BY ce.date DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching executions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete execution
// @route   DELETE /api/checklists/execution/:id
// @access  Private (Admin / Supervisor)
const deleteExecution = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM checklist_executions WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Execution not found' });
        res.json({ message: 'Execution deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save checklist execution
// @route   POST /api/checklists/execution
// @access  Private
// @desc    Save checklist execution
// @route   POST /api/checklists/execution
// @access  Private
const saveExecution = async (req, res) => {
    const { 
        id, wo_id, template_id, results, overall_status, observation,
        technician_signature, supervisor_signature, technician_name, supervisor_name
    } = req.body;

    try {
        // If an execution ID is provided, update it directly
        if (id) {
            const updated = await db.query(
                `UPDATE checklist_executions 
                 SET results = $1, overall_status = $2, observation = $3, 
                     technician_signature = $4, supervisor_signature = $5, 
                     technician_name = $6, supervisor_name = $7,
                     date = NOW() 
                 WHERE id = $8 RETURNING *`,
                [
                    JSON.stringify(results), overall_status, observation, 
                    technician_signature, supervisor_signature, technician_name, supervisor_name,
                    id
                ]
            );
            return res.json(updated.rows[0]);
        }

        // Only validate WO if it's provided and we are creating/updating by WO
        if (wo_id) {
            const woCheck = await db.query('SELECT * FROM work_orders WHERE id = $1', [wo_id]);
            if (woCheck.rows.length === 0) return res.status(404).json({ message: 'Work Order not found' });

            // Check if already executed for this WO
            const existing = await db.query('SELECT * FROM checklist_executions WHERE wo_id = $1', [wo_id]);
            if (existing.rows.length > 0) {
                // Update
                const updated = await db.query(
                    `UPDATE checklist_executions 
                     SET results = $1, overall_status = $2, observation = $3, 
                         technician_signature = $4, supervisor_signature = $5, 
                         technician_name = $6, supervisor_name = $7,
                         date = NOW() 
                     WHERE wo_id = $8 RETURNING *`,
                    [
                        JSON.stringify(results), overall_status, observation, 
                        technician_signature, supervisor_signature, technician_name, supervisor_name,
                        wo_id
                    ]
                );
                return res.json(updated.rows[0]);
            }
        }

        // Insert new execution (wo_id can be null here for standalone checklists)
        const newExecution = await db.query(
            `INSERT INTO checklist_executions 
             (wo_id, template_id, executed_by, results, overall_status, observation, 
              technician_signature, supervisor_signature, technician_name, supervisor_name) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                wo_id || null, template_id || null, req.user.id, JSON.stringify(results), overall_status, observation,
                technician_signature, supervisor_signature, technician_name, supervisor_name
            ]
        );

        // If Critical, logic to auto-generate follow-up OT could go here
        // For now, just logging it
        if (overall_status === 'CRITICAL') {
            console.log('CRITICAL CHECKLIST - Should trigger auto-OT logic');
        }

        res.status(201).json(newExecution.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTemplates,
    createTemplate,
    getExecutionByWO,
    getExecutionById,
    getExecutions,
    deleteExecution,
    saveExecution
};
