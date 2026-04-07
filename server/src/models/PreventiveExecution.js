const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const PreventiveExecution = sequelize.define('PreventiveExecution', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    preventive_plan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'preventive_plans',
            key: 'id'
        }
    },
    plant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    area_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    machine_ids: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PENDIENTE', // PENDIENTE, EN_PROGRESO, COMPLETADO
    },
    order_class: {
        type: DataTypes.STRING,
        defaultValue: 'MANTENIMIENTO PREVENTIVO',
    },
    equipment_condition: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    criticality: {
        type: DataTypes.STRING,
        allowNull: true, // ALTA, MEDIA, BAJA
    },
    action_performed: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    planning_groups: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    scheduled_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    start_time: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    end_time: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    completed_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    executor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    responsible_technicians: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    leader_technician_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    supervisor_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    task_results: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    spare_results: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    general_observations: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'preventive_executions',
    timestamps: true,
});

module.exports = PreventiveExecution;
