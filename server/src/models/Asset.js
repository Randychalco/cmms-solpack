const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Asset = sequelize.define('Asset', {
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
    category: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    brand: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    characteristics: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    location: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    plant_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ACTIVE',
    },
    specs: {
        type: DataTypes.JSONB,
        allowNull: true,
    }
}, {
    tableName: 'assets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Asset;
