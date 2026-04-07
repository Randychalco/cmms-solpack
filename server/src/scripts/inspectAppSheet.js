const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const AppSheetService = require('../services/appSheetService');

async function main() {
    try {
        const data = await AppSheetService.getTableData('Orden de Trabajo');
        console.log(`Fila de ejemplo de 'Orden de Trabajo':`);
        if (data.length > 0) {
            console.log(JSON.stringify(data[0], null, 2));
        } else {
            console.log('No hay datos en esta tabla.');
        }
    } catch (e) {
        console.error(e.message);
    }
}

main();
