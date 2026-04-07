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
    machineId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Machines',
            key: 'id'
        }
    }
});

module.exports = SubMachine;

