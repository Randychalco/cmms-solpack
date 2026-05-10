const { MaintenanceNotification, Plant, Area, Machine, SubMachine, User, WorkOrder } = require('../models');
const { Op } = require('sequelize');

// Generate unique notification number
const generateNotificationNumber = async () => {
    const lastNotification = await MaintenanceNotification.findOne({
        order: [['id', 'DESC']]
    });

    if (!lastNotification || !lastNotification.notification_number) {
        return 'AV-10001';
    }

    const lastNumber = parseInt(lastNotification.notification_number.replace('AV-', ''));
    if (isNaN(lastNumber)) {
        return 'AV-10001';
    }

    return `AV-${lastNumber + 1}`;
};

const notificationController = {
    // Create new notification
    createNotification: async (req, res) => {
        try {
            const {
                plant_id,
                area_id,
                machine_id,
                sub_machine_id,
                description,
                priority,
                requester_id
            } = req.body;

            const notification_number = await generateNotificationNumber();

            const newNotification = await MaintenanceNotification.create({
                notification_number,
                plant_id,
                area_id,
                machine_id,
                sub_machine_id,
                description,
                priority: priority || 'MEDIA',
                status: 'PENDIENTE',
                requester_id: requester_id || (req.user ? req.user.id : null)
            });

            res.status(201).json(newNotification);
        } catch (error) {
            console.error('Error creating notification:', error);
            res.status(500).json({ message: 'Error al crear el aviso de mantenimiento', error: error.message });
        }
    },

    // Get all notifications with filters
    getAllNotifications: async (req, res) => {
        try {
            const { status, priority, plant_id } = req.query;
            let whereClause = {};

            if (status) whereClause.status = status;
            if (priority) whereClause.priority = priority;
            if (plant_id) whereClause.plant_id = plant_id;

            const notifications = await MaintenanceNotification.findAll({
                where: whereClause,
                include: [
                    { model: Plant, attributes: ['id', 'name'] },
                    { model: Area, attributes: ['id', 'name'] },
                    { model: Machine, attributes: ['id', 'name'] },
                    { model: SubMachine, attributes: ['id', 'name'] },
                    { model: User, as: 'Requester', attributes: ['id', 'name'] },
                    { model: WorkOrder, attributes: ['id', 'ticket_number'] }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json(notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ message: 'Error al obtener avisos', error: error.message });
        }
    },

    // Get notification by ID
    getNotificationById: async (req, res) => {
        try {
            const { id } = req.params;
            const notification = await MaintenanceNotification.findByPk(id, {
                include: [
                    { model: Plant, attributes: ['id', 'name'] },
                    { model: Area, attributes: ['id', 'name'] },
                    { model: Machine, attributes: ['id', 'name'] },
                    { model: SubMachine, attributes: ['id', 'name'] },
                    { model: User, as: 'Requester', attributes: ['id', 'name'] },
                    { model: WorkOrder, attributes: ['id', 'ticket_number', 'status'] }
                ]
            });

            if (!notification) {
                return res.status(404).json({ message: 'Aviso no encontrado' });
            }

            res.json(notification);
        } catch (error) {
            console.error('Error fetching notification by ID:', error);
            res.status(500).json({ message: 'Error al obtener aviso', error: error.message });
        }
    },

    // Update notification
    updateNotification: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, priority, description } = req.body;

            const notification = await MaintenanceNotification.findByPk(id);

            if (!notification) {
                return res.status(404).json({ message: 'Aviso no encontrado' });
            }

            // If it's already converted and trying to go back to PENDIENTE, prevent it
            if (notification.status === 'PROCESADO' && status === 'PENDIENTE') {
                return res.status(400).json({ message: 'No se puede revertir un aviso procesado a pendiente directamente.' });
            }

            if (status) notification.status = status;
            if (priority) notification.priority = priority;
            if (description) notification.description = description;

            await notification.save();
            res.json(notification);
        } catch (error) {
            console.error('Error updating notification:', error);
            res.status(500).json({ message: 'Error al actualizar aviso', error: error.message });
        }
    },

    // Convert to Work Order
    convertToWorkOrder: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Get the notification
            const notification = await MaintenanceNotification.findByPk(id);

            if (!notification) {
                return res.status(404).json({ message: 'Aviso no encontrado' });
            }

            if (notification.status === 'PROCESADO' && notification.work_order_id) {
                return res.status(400).json({ message: 'Este aviso ya fue convertido a la OT ' + notification.work_order_id });
            }

            // We expect the OT details in the body (the ones that the maintenance planner fills out)
            const {
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
                criticality,
                observations,
                status,
                technician_signature,
                operator_signature,
                leader_technician_name,
                supervisor_name
            } = req.body;

            // Generate ticket number (safe: year-based with uniqueness check)
            const year = new Date().getFullYear();
            const ticket_number_prefix = `OT-${year}-`;

            const lastOrderThisYear = await WorkOrder.findOne({
                where: { ticket_number: { [Op.like]: `OT-${year}-%` } },
                order: [['id', 'DESC']]
            });

            let sequence = 1;
            if (lastOrderThisYear && lastOrderThisYear.ticket_number) {
                const parts = lastOrderThisYear.ticket_number.split('-');
                if (parts.length === 3) {
                    const lastSeq = parseInt(parts[2], 10);
                    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
                }
            }

            // Ensure unique ticket (safety loop)
            let nextTicketNumber = `${ticket_number_prefix}${String(sequence).padStart(4, '0')}`;
            let attempts = 0;
            while (attempts < 100) {
                const existing = await WorkOrder.findOne({ where: { ticket_number: nextTicketNumber } });
                if (!existing) break;
                sequence++;
                nextTicketNumber = `${ticket_number_prefix}${String(sequence).padStart(4, '0')}`;
                attempts++;
            }

            // Create Work Order
            const newWo = await WorkOrder.create({
                ticket_number: nextTicketNumber,
                plant_id: notification.plant_id,
                area_id: notification.area_id,
                machine_id: notification.machine_id,
                sub_machine_id: notification.sub_machine_id,
                equipment_condition,
                order_class: order_class || 'CORRECTIVO_PROGRAMADO',
                failure_description: failure_description || notification.description,
                failure_cause,
                action_taken,
                planning_group,
                technician_id,
                start_date,
                start_time,
                end_date: end_date || null,
                end_time: end_time || null,
                priority: criticality || notification.priority,
                status: status || 'ABIERTA',
                materials_used: req.body.materials_used || null,
                observations: observations || `Generado a partir del aviso ${notification.notification_number}`,
                requester_id: notification.requester_id,
                technician_signature: technician_signature || null,
                operator_signature: operator_signature || null,
                leader_technician_name: leader_technician_name || null,
                supervisor_name: supervisor_name || null
            });

            // Update Notification
            notification.status = 'PROCESADO';
            notification.work_order_id = newWo.id;
            await notification.save();

            res.status(201).json({
                message: 'OT generada exitosamente',
                workOrder: newWo,
                notification
            });

        } catch (error) {
            console.error('Error converting notification to work order:', error);
            res.status(500).json({ message: 'Error al convertir aviso a OT', error: error.message });
        }
    },

    // Delete Notification
    deleteNotification: async (req, res) => {
        try {
            const { id } = req.params;
            const notification = await MaintenanceNotification.findByPk(id);

            if (!notification) {
                return res.status(404).json({ message: 'Aviso no encontrado' });
            }

            // Optional: prevent deletion if processed? 
            // For now, allow it but maybe alert in frontend.

            await notification.destroy();
            res.json({ message: 'Aviso eliminado correctamente' });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({ message: 'Error al eliminar el aviso' });
        }
    }
};

module.exports = notificationController;
