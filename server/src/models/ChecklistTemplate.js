const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ChecklistTemplate = sequelize.define('ChecklistTemplate', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    asset_category: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    items: {
        type: DataTypes.JSONB,
        allowNull: false,
    }
}, {
    tableName: 'checklist_templates',
    timestamps: true,
});

module.exports = ChecklistTemplate;
