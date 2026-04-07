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
    area_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'areas',
            key: 'id'
        }
    }
}, {
    tableName: 'machines',
    timestamps: false
});

module.exports = Machine;

