const { sequelize, PreventiveExecution } = require('../src/models/index');
const { DataTypes } = require('sequelize');

async function migrate() {
    try {
        console.log('--- STARTING MANUAL MIGRATION: ADD machine_ids ---');
        const queryInterface = sequelize.getQueryInterface();
        
        // Add machine_ids
        try {
            await queryInterface.addColumn('PreventiveExecutions', 'machine_ids', {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: []
            });
            console.log('--- COLUMN machine_ids ADDED SUCCESSFULLY ---');
        } catch (e) {
            console.log('machine_ids likely already exists or table name mismatch:', e.message);
        }

        // Add plant_id and area_id
        try {
            await queryInterface.addColumn('PreventiveExecutions', 'plant_id', { type: DataTypes.INTEGER, allowNull: true });
        } catch (e) {}
        try {
            await queryInterface.addColumn('PreventiveExecutions', 'area_id', { type: DataTypes.INTEGER, allowNull: true });
        } catch (e) {}
        
        console.log('--- MIGRATION COMPLETED ---');
        process.exit(0);
    } catch (error) {
        console.error('--- MIGRATION FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

migrate();
