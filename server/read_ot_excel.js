const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../OT ubicacion del equipo.xlsx');
try {
    console.log('Reading file from:', filePath);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('Sheet Name:', sheetName);
    console.log('Headers:', data[0]);
    console.log('First 5 rows of data:', data.slice(1, 6));
} catch (error) {
    console.error('Error reading file:', error.message);
}
