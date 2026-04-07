const xlsx = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '../../../ACTIVOS.xlsx');
const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log('--- Resumen del Excel ---');
console.log('Columnas encontradas:', Object.keys(data[0] || {}));
console.log('Número de filas:', data.length);
console.log('Ejemplo primera fila:', JSON.stringify(data[0], null, 2));
