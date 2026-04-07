const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const PurchaseRequest = sequelize.define('PurchaseRequest', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    part_name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Nombre de la pieza o repuesto a comprar'
    },
    part_number: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Número de parte o SKU si se conoce'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Cantidad solicitada'
    },
    justification: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Justificación o motivo de la compra'
    },
    machine_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Machines',
            key: 'id'
        },
        comment: 'Opcional: máquina a la que se destinará el repuesto'
    },
    priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'MEDIA',
        comment: 'ALTA, MEDIA, BAJA'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PENDIENTE',
        comment: 'PENDIENTE, APROBADO, COTIZADO, COMPRADO, RECIBIDO, RECHAZADO'
    },
    suggested_supplier: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Proveedor sugerido o marca preferente'
    },
    po_number: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Número de Orden de Compra interna'
    },
    requester_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'PurchaseRequests',
    timestamps: true,
});

module.exports = PurchaseRequest;
