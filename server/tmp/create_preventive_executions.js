const { sequelize } = require('../src/models/index');

async function createTable() {
    try {
        console.log('--- STARTING RAW SQL TABLE CREATION: PreventiveExecutions ---');
        const sql = `
            CREATE TABLE IF NOT EXISTS "PreventiveExecutions" (
                id SERIAL PRIMARY KEY,
                preventive_plan_id INTEGER,
                plant_id INTEGER,
                area_id INTEGER,
                machine_ids JSONB,
                status VARCHAR(255) DEFAULT 'PENDIENTE',
                order_class VARCHAR(255) DEFAULT 'MANTENIMIENTO PREVENTIVO',
                equipment_condition VARCHAR(255),
                criticality VARCHAR(255),
                action_performed TEXT,
                planning_groups JSONB,
                scheduled_date DATE,
                start_date DATE,
                end_date DATE,
                start_time VARCHAR(255),
                end_time VARCHAR(255),
                completed_date TIMESTAMP WITH TIME ZONE,
                executor_id INTEGER,
                responsible_technicians JSONB,
                leader_technician_name VARCHAR(255),
                supervisor_name VARCHAR(255),
                task_results JSONB,
                spare_results JSONB,
                general_observations TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        await sequelize.query(sql);
        console.log('--- TABLE "PreventiveExecutions" CREATED SUCCESSFULLY ---');
        
        // Add index on machine_ids if it's JSONB (optional but good)
        // await sequelize.query('CREATE INDEX IF NOT EXISTS idx_preventive_machine_ids ON "PreventiveExecutions" USING GIN ("machine_ids");');
        
        process.exit(0);
    } catch (error) {
        console.error('--- CREATION FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

createTable();
