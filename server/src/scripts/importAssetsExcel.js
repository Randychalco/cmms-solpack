const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Asset, sequelize } = require('../models');

async function importAssets() {
    try {
        await sequelize.authenticate();
        console.log('--- Conexión a DB establecida para importación ---');

        const excelPath = path.join(__dirname, '../../../ACTIVOS.xlsx');
        const workbook = xlsx.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        console.log(`Procesando ${data.length} filas...`);

        let count = 0;
        let errors = 0;

        for (const row of data) {
            try {
                // Mapeo flexible de columnas basado en los encabezados comunes
                const assetData = {
                    name: row['MAQUINA'] || row['ACTIVO/MAQUINA'] || row['EQUIPO'] || 'SIN NOMBRE',
                    code: row['CODIGO'] || row['TAG'] || `ASSET-${Date.now()}-${count}`,
                    plant_name: row['PLANTA'] || 'SOLPACK',
                    brand: row['MARCA'] || '',
                    characteristics: row['CARACTERISITICAS TECNICAS'] || row['CARACTERISTICAS TECNICAS'] || row['CARACTERISTICAS'] || '',
                    category: row['CATEGORIA'] || 'INDUSTRIA',
                    location: row['LOCALIZACION'] || row['UBICACION'] || '',
                    status: 'ACTIVE'
                };

                await Asset.upsert(assetData);
                count++;
            } catch (err) {
                console.error(`Error en fila ${count + errors + 1}:`, err.message);
                errors++;
            }
        }

        console.log(`\n✅ ¡Importación Finalizada!`);
        console.log(`- Activos cargados/actualizados: ${count}`);
        console.log(`- Errores: ${errors}`);

        process.exit(0);
    } catch (error) {
        console.error('ERROR CRÍTICO:', error);
        process.exit(1);
    }
}

importAssets();
