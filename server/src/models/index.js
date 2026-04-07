const sequelize = require('../config/sequelize');
const Plant = require('./Plant');
const Area = require('./Area');
const Machine = require('./Machine');
const SubMachine = require('./SubMachine');
const WorkOrder = require('./WorkOrder');
const User = require('./User');
const Inventory = require('./Inventory');
const Asset = require('./Asset');
const RepairRecord = require('./RepairRecord');
const PurchaseRequest = require('./PurchaseRequest');
const PreventivePlan = require('./PreventivePlan');
const PreventiveExecution = require('./PreventiveExecution');
const StandardTask = require('./StandardTask');

// StandardTask associations
Machine.hasMany(StandardTask, { foreignKey: 'machine_id' });
StandardTask.belongsTo(Machine, { foreignKey: 'machine_id' });

const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected via Sequelize.');

        // Define Associations

        // Plant <-> Area
        Plant.hasMany(Area, { foreignKey: 'plantId', onDelete: 'CASCADE' });
        Area.belongsTo(Plant, { foreignKey: 'plantId' });

        // Area <-> Machine
        Area.hasMany(Machine, { foreignKey: 'areaId', onDelete: 'CASCADE' });
        Machine.belongsTo(Area, { foreignKey: 'areaId' });

        // Machine <-> SubMachine
        Machine.hasMany(SubMachine, { foreignKey: 'machineId', onDelete: 'CASCADE' });
        SubMachine.belongsTo(Machine, { foreignKey: 'machineId' });

        // Machine <-> RepairRecord
        Machine.hasMany(RepairRecord, { foreignKey: 'machine_id', onDelete: 'CASCADE' });
        RepairRecord.belongsTo(Machine, { foreignKey: 'machine_id' });

        // Machine <-> PurchaseRequest
        Machine.hasMany(PurchaseRequest, { foreignKey: 'machine_id', onDelete: 'SET NULL' });
        PurchaseRequest.belongsTo(Machine, { foreignKey: 'machine_id' });

        // WorkOrder Associations
        Plant.hasMany(WorkOrder, { foreignKey: 'plant_id', onDelete: 'SET NULL' });
        WorkOrder.belongsTo(Plant, { foreignKey: 'plant_id' });

        Area.hasMany(WorkOrder, { foreignKey: 'area_id', onDelete: 'SET NULL' });
        WorkOrder.belongsTo(Area, { foreignKey: 'area_id' });

        Machine.hasMany(WorkOrder, { foreignKey: 'machine_id', onDelete: 'SET NULL' });
        WorkOrder.belongsTo(Machine, { foreignKey: 'machine_id' });

        SubMachine.hasMany(WorkOrder, { foreignKey: 'sub_machine_id', onDelete: 'SET NULL' });
        WorkOrder.belongsTo(SubMachine, { foreignKey: 'sub_machine_id' });

        // WorkOrder <-> User
        WorkOrder.belongsTo(User, { as: 'Requester', foreignKey: 'requester_id' });
        // WorkOrder.belongsTo(User, { as: 'Technician', foreignKey: 'technician_id' });

        // User <-> PurchaseRequest
        User.hasMany(PurchaseRequest, { foreignKey: 'requester_id', onDelete: 'SET NULL' });
        PurchaseRequest.belongsTo(User, { as: 'Requester', foreignKey: 'requester_id' });

        // PreventivePlan Associations
        Machine.hasMany(PreventivePlan, { foreignKey: 'machine_id', onDelete: 'CASCADE' });
        PreventivePlan.belongsTo(Machine, { foreignKey: 'machine_id' });

        PreventivePlan.hasMany(PreventiveExecution, { foreignKey: 'preventive_plan_id', onDelete: 'CASCADE' });
        PreventiveExecution.belongsTo(PreventivePlan, { foreignKey: 'preventive_plan_id' });

        User.hasMany(PreventiveExecution, { foreignKey: 'executor_id', onDelete: 'SET NULL' });
        PreventiveExecution.belongsTo(User, { as: 'Executor', foreignKey: 'executor_id' });

        PreventiveExecution.belongsTo(Plant, { foreignKey: 'plant_id' });
        PreventiveExecution.belongsTo(Area, { foreignKey: 'area_id' });

        // Drop stale enum types that block ALTER TABLE (PostgreSQL limitation)
        try {
            await sequelize.query(`ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;`);
            await sequelize.query(`ALTER TABLE "users" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::VARCHAR;`);
            await sequelize.query(`DROP TYPE IF EXISTS "enum_users_status";`);
        } catch (e) {
            // Ignore if already VARCHAR or type doesn't exist
        }

        // Sync models with database
        await sequelize.sync({ force: true });
        console.log('Database synced successfully with FORCE: TRUE.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = {
    sequelize,
    Plant,
    Area,
    Machine,
    SubMachine,
    WorkOrder,
    User,
    Inventory,
    Asset,
    RepairRecord,
    PurchaseRequest,
    PreventivePlan,
    PreventiveExecution,
    StandardTask,
    syncDatabase,
};
