const { PreventivePlan, PreventiveExecution, Machine, User, Plant, Area } = require('../models');

// --- PLANS ---

// @desc    Get all preventive plans
// @route   GET /api/preventive/plans
// @access  Private
const getPreventivePlans = async (req, res) => {
    try {
        const plans = await PreventivePlan.findAll({
            include: [{ model: Machine, attributes: ['id', 'name'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(plans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single plan
// @route   GET /api/preventive/plans/:id
// @access  Private
const getPreventivePlanById = async (req, res) => {
    try {
        const plan = await PreventivePlan.findByPk(req.params.id, {
            include: [{ model: Machine, attributes: ['id', 'name'] }]
        });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json(plan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a preventive plan
// @route   POST /api/preventive/plans
// @access  Private
const createPreventivePlan = async (req, res) => {
    try {
        const { name, description, machine_id, frequency_days, tasks, spares } = req.body;
        const newPlan = await PreventivePlan.create({
            name, description, machine_id, frequency_days, tasks, spares
        });
        res.status(201).json(newPlan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a preventive plan
// @route   PUT /api/preventive/plans/:id
// @access  Private
const updatePreventivePlan = async (req, res) => {
    try {
        const plan = await PreventivePlan.findByPk(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        await plan.update(req.body);
        res.json(plan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a preventive plan
// @route   DELETE /api/preventive/plans/:id
// @access  Private
const deletePreventivePlan = async (req, res) => {
    try {
        const plan = await PreventivePlan.findByPk(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        await plan.destroy();
        res.json({ message: 'Plan removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- EXECUTIONS ---

// @desc    Get all executions
// @route   GET /api/preventive/executions
// @access  Private
const getExecutions = async (req, res) => {
    try {
        const executions = await PreventiveExecution.findAll({
            include: [
                { model: PreventivePlan, include: [Machine] },
                { model: User, as: 'Executor', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(executions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get execution by id
// @route   GET /api/preventive/executions/:id
// @access  Private
const getExecutionById = async (req, res) => {
    try {
        const execution = await PreventiveExecution.findByPk(req.params.id, {
            include: [
                { model: PreventivePlan, include: [Machine] },
                { model: User, as: 'Executor', attributes: ['id', 'name'] },
                { model: Plant, attributes: ['name'] },
                { model: Area, attributes: ['name'] }
            ]
        });
        if (!execution) return res.status(404).json({ message: 'Execution not found' });
        res.json(execution);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a new execution (from plan or manual)
// @route   POST /api/preventive/executions
// @access  Private
const createExecution = async (req, res) => {
    try {
        const { 
            preventive_plan_id, 
            plant_id, area_id, machine_ids,
            equipment_condition, criticality, action_performed, planning_groups,
            start_date, end_date, start_time, end_time,
            responsible_technicians, leader_technician_name, supervisor_name,
            task_results, spare_results, general_observations,
            scheduled_date 
        } = req.body;
        
        let initial_task_results = task_results || [];
        let initial_spare_results = spare_results || [];

        // If from plan, and results are not provided, initialize them
        if (preventive_plan_id && (!task_results || task_results.length === 0)) {
            const plan = await PreventivePlan.findByPk(preventive_plan_id);
            if (plan) {
                initial_task_results = (plan.tasks || []).map(t => ({
                    task_id: t.id,
                    task_code: t.task_code,
                    task_description: t.task_description,
                    checked: false,
                    observation: ''
                }));
                initial_spare_results = (plan.spares || []).map(s => ({
                    spare_id: s.id,
                    inventory_id: s.inventory_id,
                    expected_quantity: s.expected_quantity,
                    used_quantity: 0,
                    name: s.name
                }));
            }
        }

        const execution = await PreventiveExecution.create({
            preventive_plan_id,
            plant_id, area_id, machine_ids,
            status: 'PENDIENTE',
            order_class: 'MANTENIMIENTO PREVENTIVO',
            equipment_condition, criticality, action_performed, planning_groups,
            scheduled_date: scheduled_date || start_date || new Date(),
            start_date, end_date, start_time, end_time,
            executor_id: req.user.id,
            responsible_technicians, leader_technician_name, supervisor_name,
            task_results: initial_task_results,
            spare_results: initial_spare_results,
            general_observations
        });
        
        res.status(201).json(execution);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update execution (save progress or complete)
// @route   PUT /api/preventive/executions/:id
// @access  Private
const updateExecution = async (req, res) => {
    try {
        const execution = await PreventiveExecution.findByPk(req.params.id);
        if (!execution) return res.status(404).json({ message: 'Execution not found' });

        const { 
            status, task_results, spare_results, general_observations,
            equipment_condition, criticality, action_performed, planning_groups,
            start_date, end_date, start_time, end_time,
            responsible_technicians, leader_technician_name, supervisor_name
        } = req.body;
        
        const updateData = {
            status: status || execution.status,
            task_results: task_results !== undefined ? task_results : execution.task_results,
            spare_results: spare_results !== undefined ? spare_results : execution.spare_results,
            general_observations: general_observations !== undefined ? general_observations : execution.general_observations,
            equipment_condition: equipment_condition !== undefined ? equipment_condition : execution.equipment_condition,
            criticality: criticality !== undefined ? criticality : execution.criticality,
            action_performed: action_performed !== undefined ? action_performed : execution.action_performed,
            planning_groups: planning_groups !== undefined ? planning_groups : execution.planning_groups,
            start_date: start_date !== undefined ? start_date : execution.start_date,
            end_date: end_date !== undefined ? end_date : execution.end_date,
            start_time: start_time !== undefined ? start_time : execution.start_time,
            end_time: end_time !== undefined ? end_time : execution.end_time,
            responsible_technicians: responsible_technicians !== undefined ? responsible_technicians : execution.responsible_technicians,
            leader_technician_name: leader_technician_name !== undefined ? leader_technician_name : execution.leader_technician_name,
            supervisor_name: supervisor_name !== undefined ? supervisor_name : execution.supervisor_name
        };

        if (status === 'COMPLETADO' && execution.status !== 'COMPLETADO') {
            const { Inventory } = require('../models');
            updateData.completed_date = new Date();
            
            // Deduct inventory
            if (updateData.spare_results && Array.isArray(updateData.spare_results)) {
                for (const spare of updateData.spare_results) {
                    if (spare.inventory_id && spare.used_quantity > 0) {
                        const item = await Inventory.findByPk(spare.inventory_id);
                        if (item) {
                            await item.decrement('current_stock', { by: spare.used_quantity });
                        }
                    }
                }
            }
        }

        await execution.update(updateData);
        res.json(execution);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getPreventivePlans,
    getPreventivePlanById,
    createPreventivePlan,
    updatePreventivePlan,
    deletePreventivePlan,
    getExecutions,
    getExecutionById,
    createExecution,
    updateExecution
};
