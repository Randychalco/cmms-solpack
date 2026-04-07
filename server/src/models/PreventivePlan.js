const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const PreventivePlan = sequelize.define('PreventivePlan', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    machine_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Machines',
            key: 'id'
        }
    },
    frequency_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30, // Default to a month
    },
    tasks: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    spares: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'PreventivePlans',
    timestamps: true,
});

module.exports = PreventivePlan;
