const appId = '4b878ec7-ee1b-4792-8a07-834843a23b3b';
const accessKey = 'V2-kNVxW-BbXcH-uXnJv-D54Rc-ezaAG-spZhL-uCoHQ-7Tps1';
const tableNames = [
    'CATALOGO', 'Catalogo', 'Catálogo', 'Inventario', 'Activos_Solpack', 'Activos Solpack',
    'Maquinaria Solpack', 'Equipos Solpack', 'Maestro de Activos', 'Maestro de Equipos',
    'ACTIVOS_STRETCH', 'ACTIVOS_RECICLAJE', 'ACTIVOS_SML', 'ACTIVOS_EREMA',
    'GMAO_Activos', 'GMAO_Equipos', 'MAQUINARIA_GMAO'
];

async function checkTable(tableName) {
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
                    Properties: { Locale: 'en-US', Timezone: 'UTC' },
                    Rows: []
                })
            }
        );

        if (response.ok) {
            const data = await response.json();
            const rows = Array.isArray(data) ? data : (data.Rows || []);
            if (rows.length > 0) {
                const cols = Object.keys(rows[0]).map(c => c.toUpperCase());
                if (cols.includes('TAG') || cols.includes('MARCA') || cols.includes('CARACTERISTICAS')) {
                    console.log(`!!! SUCCESS !!! Table: [${tableName}]`);
                    console.log(`Columns found: ${Object.keys(rows[0]).join(', ')}`);
                    process.exit(0);
                }
            }
        }
    } catch (error) { }
}

async function main() {
    console.log('Starting Heuristic Scan...');
    for (const name of tableNames) {
        process.stdout.write(`Trying ${name}... `);
        await checkTable(name);
        console.log('no match.');
    }
}

main();
