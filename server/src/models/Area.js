const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Area = sequelize.define('Area', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    plant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'plants',
            key: 'id'
        }
    }
}, {
    tableName: 'areas',
    timestamps: false
});

module.exports = Area;

