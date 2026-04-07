const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Machine = sequelize.define('Machine', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    areaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Areas',
            key: 'id'
        }
    }
});

module.exports = Machine;

