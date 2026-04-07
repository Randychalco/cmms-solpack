const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const SubMachine = sequelize.define('SubMachine', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    machine_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'machines',
            key: 'id'
        }
    }
}, {
    tableName: 'sub_machines',
    timestamps: false
});

module.exports = SubMachine;

