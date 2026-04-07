
const appId = '4b878ec7-ee1b-4792-8a07-834843a23b3b';
const accessKey = 'V2-kNVxW-BbXcH-uXnJv-D54Rc-ezaAG-spZhL-uCoHQ-7Tps1';
const tableNames = [
    'Datos Maestros', 'Maestro', 'Configuracion', 'Listas',
    'Plantas', 'Areas', 'Sectores', 'Lineas',
    'Ubicacion', 'Ubicaciones', 'Locaciones',
    'Activo', 'Activos', 'Equipo', 'Equipos', 'Maquinaria', 'Maquinas',
    'Componentes', 'SubEquipos', 'Sub-Equipos',
    'Catálogo', 'Catalogo', 'Inventario',
    'Referencia', 'Referencias', 'Tablas'
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
                    Properties: {
                        Locale: 'en-US',
                        Timezone: 'UTC'
                    },
                    Rows: []
                })
            }
        );

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) || data.Rows) {
                console.log(`MATCH FOUND: '${tableName}'`);
            }
        }
    } catch (error) { }
}

async function main() {
    console.log('Broad Search for Master Data Tables...');
    const promises = tableNames.map(name => checkTable(name));
    await Promise.all(promises);
    console.log('Search complete.');
}

main();
