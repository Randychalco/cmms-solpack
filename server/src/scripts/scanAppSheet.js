const appId = '4b878ec7-ee1b-4792-8a07-834843a23b3b';
const accessKey = 'V2-kNVxW-BbXcH-uXnJv-D54Rc-ezaAG-spZhL-uCoHQ-7Tps1';
const tableNames = [
    'Activos', 'ACTIVOS', 'Activo', 'EQUIPOS', 'Equipos', 'MAQUINARIA', 'Maquinaria',
    'Datos Maestros', 'Maestro', 'MASTER', 'Assets', 'ASSETS'
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
            if (Array.isArray(data) && data.length > 0) {
                console.log(`FOUND: [${tableName}] with ${data.length} rows.`);
            }
        }
    } catch (error) { }
}

async function main() {
    console.log('Scanning AppSheet Tables...');
    for (const name of tableNames) {
        await checkTable(name);
    }
}

main();
