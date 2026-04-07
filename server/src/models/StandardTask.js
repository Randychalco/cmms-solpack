const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const StandardTask = sequelize.define('StandardTask', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    machine_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'machines',
            key: 'id'
        }
    },
    task_code: {
        type: DataTypes.STRING,
        allowNull: false, // MEC, ELE, LUB, etc.
    },
    task_description: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    tableName: 'standard_tasks',
    timestamps: true,
});

module.exports = StandardTask;
