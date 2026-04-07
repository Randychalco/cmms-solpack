const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Plant, Area, Machine, SubMachine, Asset, sequelize } = require('../models');

async function loadAssetsFromHierarchy() {
    try {
        console.log('--- Iniciando migración de jerarquía a tabla de Activos ---');

        // Sincronizar modelos primero por si acaso
        await sequelize.sync({ alter: true });
        console.log('Esquema de base de datos sincronizado.');

        const subMachines = await SubMachine.findAll({
            include: [
                {
                    model: Machine,
                    include: [
                        {
                            model: Area,
                            include: [Plant]
                        }
                    ]
                }
            ]
        });

        console.log(`Encontrados ${subMachines.length} sub-equipos en la jerarquía.`);

        let count = 0;
        let errors = 0;

        for (const sub of subMachines) {
            try {
                const machine = sub.Machine;
                if (!machine) {
                    console.warn(`Sub-equipo ID ${sub.id} (${sub.name}) no tiene máquina asociada. Saltando.`);
                    continue;
                }
                const area = machine.Area;
                if (!area) {
                    console.warn(`Máquina ID ${machine.id} (${machine.name}) no tiene área asociada. Saltando.`);
                    continue;
                }
                const plant = area.Plant;
                if (!plant) {
                    console.warn(`Área ID ${area.id} (${area.name}) no tiene planta asociada. Saltando.`);
                    continue;
                }

                // Generar TAG único consistente
                const getAbbreviation = (text) => {
                    if (!text) return 'N/A';
                    return text.split(' ')
                        .filter(word => word.length > 0)
                        .map(word => word[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 3);
                };

                const plantTag = getAbbreviation(plant.name);
                const areaTag = getAbbreviation(area.name);
                const machineTag = machine.name.replace(/\s+/g, '').toUpperCase();
                const subTag = sub.name.split(' ')
                    .filter(w => w.length > 0)
                    .map(w => w.substring(0, 3))
                    .join('')
                    .toUpperCase()
                    .substring(0, 4);

                const code = `${plantTag}-${areaTag}-${machineTag}-${subTag}`;

                const assetData = {
                    name: sub.name,
                    code: code,
                    category: area.name,
                    plant_name: plant.name,
                    location: `${plant.name} > ${area.name} > ${machine.name}`,
                    status: 'ACTIVE',
                    brand: '',
                    characteristics: '',
                    specs: {
                        plant: plant.name,
                        area: area.name,
                        machine: machine.name,
                        submachine: sub.name
                    }
                };

                // Usar upsert de Sequelize
                await Asset.upsert(assetData);

                count++;
                if (count % 50 === 0) console.log(`Procesados ${count} activos...`);
            } catch (err) {
                console.error(`Error procesando sub-equipo ID ${sub.id}:`, err.message);
                errors++;
            }
        }

        console.log(`\n✅ Proceso finalizado.`);
        console.log(`- Activos procesados/actualizados: ${count}`);
        console.log(`- Errores encontrados: ${errors}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fatal en la migración de activos:', error);
        process.exit(1);
    }
}

loadAssetsFromHierarchy();
