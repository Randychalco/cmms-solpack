const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ChecklistExecution = sequelize.define('ChecklistExecution', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    wo_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'work_orders',
            key: 'id'
        }
    },
    template_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'checklist_templates',
            key: 'id'
        }
    },
    executed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    results: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    overall_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'OK',
    },
    observation: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    technician_signature: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    supervisor_signature: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    technician_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    supervisor_name: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'checklist_executions',
    timestamps: false,
});

module.exports = ChecklistExecution;
