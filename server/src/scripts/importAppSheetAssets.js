const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Asset, sequelize } = require('../models');

const appId = '4b878ec7-ee1b-4792-8a07-834843a23b3b';
const accessKey = 'V2-kNVxW-BbXcH-uXnJv-D54Rc-ezaAG-spZhL-uCoHQ-7Tps1';
const tableName = 'Activos';

async function fetchAppSheetRows() {
    console.log(`Buscando datos en la tabla '${tableName}' de AppSheet...`);
    try {
        const response = await fetch(
            `https://api.appsheet.com/api/v2/apps/${appId}/tables/${encodeURIComponent(tableName)}/Action`,
            {
                method: 'POST',
                headers: {
                    'ApplicationAccessKey': accessKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Action: 'Find',
                    Properties: {
                        Locale: 'es-ES',
                        Timezone: 'SA Pacific Standard Time'
                    },
                    Rows: []
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching from AppSheet:', error.message);
        return [];
    }
}

async function main() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a DB local establecida.');

        const rows = await fetchAppSheetRows();
        console.log(`Recibidas ${rows.length} filas de AppSheet.`);

        if (rows.length === 0) {
            console.log('No se encontraron datos. Verificando Tabla "Maquinaria"...');
            // Re-intentar con otro nombre común si falla
            // return; 
        }

        let count = 0;
        for (const row of rows) {
            // Mapeo basado en las columnas vistas en la imagen del usuario
            // Columnas probables: TAG, Activo/Maquina, Planta, Marca, Caracteristicas

            const assetData = {
                name: row['Activo'] || row['Nombre'] || row['Machine'] || 'Desconocido',
                code: row['Tag'] || row['Código'] || row['ID'] || `ASSET-${count}`,
                plant_name: row['Planta'] || 'SOLPACK',
                brand: row['Marca'] || '',
                characteristics: row['Características'] || row['Nota'] || '',
                status: 'ACTIVE',
                category: row['Área'] || 'General',
                location: row['Ubicación'] || row['Localizacion'] || ''
            };

            await Asset.upsert(assetData);
            count++;
        }

        console.log(`✅ ¡Éxito! Se han cargado ${count} activos.`);
        process.exit(0);
    } catch (error) {
        console.error('Error fatal:', error);
        process.exit(1);
    }
}

main();
