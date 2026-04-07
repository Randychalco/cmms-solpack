const appId = '4b878ec7-ee1b-4792-8a07-834843a23b3b';
const accessKey = 'V2-kNVxW-BbXcH-uXnJv-D54Rc-ezaAG-spZhL-uCoHQ-7Tps1';
const tableNames = [
    'Datos Maestros', 'Maestro', 'Configuracion', 'Listas',
    'Plantas', 'Areas', 'Sectores', 'Lineas',
    'Ubicacion', 'Ubicaciones', 'Locaciones',
    'Activo', 'Activos', 'Equipo', 'Equipos', 'Maquinaria', 'Maquinas',
    'Componentes', 'SubEquipos', 'Sub-Equipos',
    'Catálogo', 'Catalogo', 'Inventario',
    'Referencia', 'Referencias', 'Tablas', 'ACTIVOS'
];

async function checkTable(tableName) {
    console.log(`Checking [${tableName}]...`);
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
                console.log(`!!! MATCH FOUND: [${tableName}] with ${rows.length} rows.`);
                console.log(`Columns: ${Object.keys(rows[0]).join(', ')}`);
                return true;
            }
        } else {
            // console.log(`Failed [${tableName}]: ${response.status}`);
        }
    } catch (error) {
        console.log(`Error [${tableName}]: ${error.message}`);
    }
    return false;
}

async function main() {
    for (const name of tableNames) {
        await checkTable(name);
    }
}

main();
