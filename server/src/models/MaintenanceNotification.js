const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const MaintenanceNotification = sequelize.define('MaintenanceNotification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    notification_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    // Jerarquía de equipos
    plant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'plants',
            key: 'id'
        }
    },
    area_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'areas',
            key: 'id'
        }
    },
    machine_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'machines',
            key: 'id'
        }
    },
    sub_machine_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'sub_machines',
            key: 'id'
        }
    },
    // Información del aviso
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Descripción del problema reportado'
    },
    priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'MEDIA',
        comment: 'BAJO, MEDIO, ALTO, CRITICO'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PENDIENTE',
        comment: 'PENDIENTE, PROCESADO, RECHAZADO'
    },
    requester_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Usuario de producción que reporta el aviso'
    },
    work_order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'work_orders',
            key: 'id'
        },
        comment: 'OT generada a partir de este aviso'
    }
}, {
    tableName: 'maintenance_notifications',
    timestamps: true,
});

module.exports = MaintenanceNotification;
