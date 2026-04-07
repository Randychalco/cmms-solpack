const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Inventory = sequelize.define('Inventory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    current_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    min_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    tech_specs: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
    }
}, {
    tableName: 'inventory',
    timestamps: true,
});

module.exports = Inventory;
