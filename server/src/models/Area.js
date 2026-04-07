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
    plantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Plants',
            key: 'id'
        }
    }
});

module.exports = Area;

