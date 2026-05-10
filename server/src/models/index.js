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
const ChecklistTemplate = require('./ChecklistTemplate');
const ChecklistExecution = require('./ChecklistExecution');
const MaintenanceNotification = require('./MaintenanceNotification');

// StandardTask associations
Machine.hasMany(StandardTask, { foreignKey: 'machine_id' });
StandardTask.belongsTo(Machine, { foreignKey: 'machine_id' });

const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected via Sequelize.');

        // Define Associations

        // Plant <-> Area
        Plant.hasMany(Area, { foreignKey: 'plant_id', onDelete: 'CASCADE' });
        Area.belongsTo(Plant, { foreignKey: 'plant_id' });

        // Area <-> Machine
        Area.hasMany(Machine, { foreignKey: 'area_id', onDelete: 'CASCADE' });
        Machine.belongsTo(Area, { foreignKey: 'area_id' });

        // Machine <-> SubMachine
        Machine.hasMany(SubMachine, { foreignKey: 'machine_id', onDelete: 'CASCADE' });
        SubMachine.belongsTo(Machine, { foreignKey: 'machine_id' });

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

        // Checklist Associations
        ChecklistTemplate.hasMany(ChecklistExecution, { foreignKey: 'template_id', onDelete: 'CASCADE' });
        ChecklistExecution.belongsTo(ChecklistTemplate, { foreignKey: 'template_id' });

        WorkOrder.hasOne(ChecklistExecution, { foreignKey: 'wo_id', onDelete: 'CASCADE' });
        ChecklistExecution.belongsTo(WorkOrder, { foreignKey: 'wo_id' });

        // WorkOrder <-> User
        WorkOrder.belongsTo(User, { as: 'Requester', foreignKey: 'requester_id' });

        // MaintenanceNotification Associations
        Plant.hasMany(MaintenanceNotification, { foreignKey: 'plant_id', onDelete: 'SET NULL' });
        MaintenanceNotification.belongsTo(Plant, { foreignKey: 'plant_id' });

        Area.hasMany(MaintenanceNotification, { foreignKey: 'area_id', onDelete: 'SET NULL' });
        MaintenanceNotification.belongsTo(Area, { foreignKey: 'area_id' });

        Machine.hasMany(MaintenanceNotification, { foreignKey: 'machine_id', onDelete: 'SET NULL' });
        MaintenanceNotification.belongsTo(Machine, { foreignKey: 'machine_id' });

        SubMachine.hasMany(MaintenanceNotification, { foreignKey: 'sub_machine_id', onDelete: 'SET NULL' });
        MaintenanceNotification.belongsTo(SubMachine, { foreignKey: 'sub_machine_id' });

        User.hasMany(MaintenanceNotification, { foreignKey: 'requester_id', onDelete: 'SET NULL' });
        MaintenanceNotification.belongsTo(User, { as: 'Requester', foreignKey: 'requester_id' });

        WorkOrder.hasOne(MaintenanceNotification, { foreignKey: 'work_order_id', onDelete: 'SET NULL' });
        MaintenanceNotification.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

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
        PreventiveExecution.belongsTo(Machine, { foreignKey: 'machine_id' });
        PreventiveExecution.belongsTo(SubMachine, { foreignKey: 'sub_machine_id' });

        // Sync models with database
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');
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
    ChecklistTemplate,
    ChecklistExecution,
    MaintenanceNotification,
    syncDatabase,
};
