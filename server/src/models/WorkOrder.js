const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');


const WorkOrder = sequelize.define('WorkOrder', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    ticket_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    // Jerarquía de equipos
    plant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Plants',
            key: 'id'
        }
    },
    area_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Areas',
            key: 'id'
        }
    },
    machine_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Machines',
            key: 'id'
        }
    },
    sub_machine_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'SubMachines',
            key: 'id'
        }
    },
    // Información de la orden
    equipment_condition: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Parado, Funcionamiento, Programado'
    },
    order_class: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'CORRECTIVO_PROGRAMADO',
        comment: 'Emergencia, Correctivo Programado, Tarea, Proyecto, Operación, Mantenimiento Preventivo, IVS, Lubricación'
    },
    // Descripción de falla y acciones
    failure_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descripción de la falla'
    },
    failure_cause: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Causa raíz de la falla'
    },
    action_taken: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Acciones correctivas realizadas'
    },
    // Planificación y asignación
    planning_group: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Mecánico, Eléctrico, Electrónico, Neumático, Hidráulico, Operacional, Mantenimiento Preventivo, IVS, Lubricación, Pruebas de Funcionamiento'
    },
    requester_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Usuario que solicita la OT'
    },
    technician_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Nombre del Técnico (LBERROSPI, MJUAREZ, etc.)'
    },
    // Fechas y horas
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha de inicio del trabajo'
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Hora de inicio del trabajo'
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha de finalización del trabajo'
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Hora de finalización del trabajo'
    },
    // Materiales y observaciones
    materials_used: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Materiales utilizados en la OT'
    },
    observations: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Observaciones adicionales'
    },
    // Firmas digitales
    technician_signature: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Firma digital del técnico (base64 o URL)'
    },
    operator_signature: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Firma digital del maquinista (base64 o URL)'
    },
    // Estado
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ABIERTA',
        comment: 'ABIERTA, EN_PROCESO, PENDIENTE_MATERIALES, CERRADA'
    },
    priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'MEDIA',
        comment: 'BAJO, MEDIO, ALTO, CRITICO'
    },
}, {
    tableName: 'WorkOrders',
    timestamps: true,
});

module.exports = WorkOrder;
