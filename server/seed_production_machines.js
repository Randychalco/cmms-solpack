const { Area, Machine } = require('./src/models');

async function seedMachines() {
    try {
        console.log('Seeding Production Machines...');

        // Find Areas
        const extrusion2 = await Area.findOne({ where: { name: 'EXTRUSIÓN 2' } });
        const corte = await Area.findOne({ where: { name: 'CORTE Y REBOBINADO' } });

        if (!extrusion2 || !corte) {
            console.error('❌ Critical areas not found (EXTRUSION 2 or CORTE). Run production_seed.js first.');
            process.exit(1);
        }

        const machinesToSeed = [
            { name: 'SML 1', area_id: extrusion2.id, code: 'SML1', critical: true },
            { name: 'SML 2', area_id: extrusion2.id, code: 'SML2', critical: true },
            { name: 'Webtec 1', area_id: corte.id, code: 'WEB1', critical: false },
            { name: 'Webtec 2', area_id: corte.id, code: 'WEB2', critical: false }
        ];

        for (const m of machinesToSeed) {
            const [machine, created] = await Machine.findOrCreate({
                where: { name: m.name },
                defaults: {
                    area_id: m.area_id,
                    code: m.code,
                    is_active: true
                }
            });

            if (created) {
                console.log(`✅ Machine created: ${m.name}`);
            } else {
                console.log(`- Machine already exists: ${m.name}`);
                await machine.update({ area_id: m.area_id, code: m.code });
            }
        }

        console.log('--- SEEDING COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding machines:', error);
        process.exit(1);
    }
}

seedMachines();
