const db = require('./src/config/db');

async function renameErema() {
    try {
        console.log('Renaming machines...');
        await db.query(`UPDATE "Machines" SET name = 'EREMA 1' WHERE name = 'SML1 - EREMA'`);
        await db.query(`UPDATE "Machines" SET name = 'EREMA 2' WHERE name = 'SML2 - EREMA'`);
        await db.query(`UPDATE "Machines" SET name = 'EREMA 1' WHERE name = 'SML1-EREMA'`);
        await db.query(`UPDATE "Machines" SET name = 'EREMA 2' WHERE name = 'SML2-EREMA'`);

        console.log('Renaming templates...');
        // Let's also check if checklist templates exist and rename them
        const t1 = await db.query(`UPDATE checklist_templates SET name = 'RUTINA DE INSPECCION GENERAL - Erema 1' WHERE name ILIKE '%SML1%EREMA%' RETURNING id`);
        console.log('Renamed templates 1:', t1.rowCount);
        const t2 = await db.query(`UPDATE checklist_templates SET name = 'RUTINA DE INSPECCION GENERAL - Erema 2' WHERE name ILIKE '%SML2%EREMA%' RETURNING id`);
        console.log('Renamed templates 2:', t2.rowCount);
        
        console.log('Done.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
renameErema();
