const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Plant, Area, Machine, SubMachine, Asset, sequelize } = require('../models');

async function loadAssets() {
    try {
        console.log('--- Iniciando migración ultra-robusta (Mapeo en Memoria) ---');
        await sequelize.authenticate();

        const plants = await Plant.findAll();
        const areas = await Area.findAll();
        const machines = await Machine.findAll();
        const subMachines = await SubMachine.findAll();

        console.log(`Datos maestros: ${plants.length} Plantas, ${areas.length} Áreas, ${machines.length} Máquinas, ${subMachines.length} Sub-máquinas.`);

        const pMap = new Map(plants.map(p => [p.id, p]));
        const aMap = new Map(areas.map(a => [a.id, a]));
        const mMap = new Map(machines.map(m => [m.id, m]));

        let count = 0;
        for (const sub of subMachines) {
            const m = mMap.get(sub.machineId);
            const a = m ? aMap.get(m.areaId) : null;
            const p = a ? pMap.get(a.plantId) : null;

            if (!m || !a || !p) continue;

            const getAbbr = (t) => t ? t.split(' ').filter(x => x).map(x => x[0]).join('').toUpperCase().substring(0, 3) : '--';
            const machineTag = m.name.replace(/\s+/g, '').toUpperCase();
            const subTag = sub.name.split(' ').filter(x => x).map(x => x.substring(0, 3)).join('').toUpperCase().substring(0, 4);
            const code = `${getAbbr(p.name)}-${getAbbr(a.name)}-${machineTag}-${subTag}`;

            await Asset.upsert({
                name: sub.name,
                code: code,
                category: a.name,
                plant_name: p.name,
                location: `${p.name} > ${a.name} > ${m.name}`,
                status: 'ACTIVE',
                brand: '',
                characteristics: '',
                specs: { plant: p.name, area: a.name, machine: m.name, submachine: sub.name }
            });
            count++;
        }

        console.log(`✅ Éxito total: ${count} activos cargados.`);
        process.exit(0);
    } catch (error) {
        console.error('ERROR FATAL:', error);
        process.exit(1);
    }
}

loadAssets();
