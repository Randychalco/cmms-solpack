const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const RepairRecord = sequelize.define('RepairRecord', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
    part_name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Nombre de la parte o repuesto enviado a reparar'
    },
    issue_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Motivo de la falla o motivo de la reparación'
    },
    supplier_name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Proveedor o taller responsable de la reparación'
    },
    sent_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Fecha de envío a reparación'
    },
    expected_return_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha estimada o prometida de retorno'
    },
    return_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha real de regreso a planta'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ENVIADO',
        comment: 'ENVIADO, DEVUELTO'
    },
    repair_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Costo de la reparación'
    },
    repair_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas sobre la recepción, trabajos realizados o recomendaciones'
    }
}, {
    tableName: 'repair_records',
    timestamps: true,
});

module.exports = RepairRecord;
