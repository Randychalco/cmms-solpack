const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const AppSheetService = require('../services/appSheetService');

async function main() {
    try {
        const data = await AppSheetService.getTableData('Orden de Trabajo');
        if (data.length > 0) {
            console.log('Detecting possible references in Orden de Trabajo...');
            const firstRow = data[0];
            for (const key in firstRow) {
                if (typeof firstRow[key] === 'string' && firstRow[key].length > 0) {
                    console.log(`Column: ${key} | Example: ${firstRow[key]}`);
                }
            }
        }
    } catch (e) {
        console.error(e.message);
    }
}

main();
