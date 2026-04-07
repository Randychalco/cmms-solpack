
const appId = '4b878ec7-ee1b-4792-8a07-834843a23b3b';
const accessKey = 'V2-kNVxW-BbXcH-uXnJv-D54Rc-ezaAG-spZhL-uCoHQ-7Tps1';
// Common names for asset/location hierarchies
const tableNames = [
    'Activos', 'Equipos', 'Maquinas', 'Machines', 'Assets',
    'Ubicaciones', 'Locations', 'Plantas', 'Plants',
    'Areas', 'Sectores', 'Lineas', 'Lines'
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

        if (!response.ok) {
            // console.log(`Table '${tableName}' failed: ${response.status}`);
            return;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            console.log(`Table '${tableName}' found. Rows: ${data.length}`);
            console.log(`Structure of '${tableName}':`, Object.keys(data[0]));
            // console.log('Sample:', JSON.stringify(data[0], null, 2));
        } else if (data.Rows && data.Rows.length > 0) {
            console.log(`Table '${tableName}' found. Rows: ${data.Rows.length}`);
            console.log(`Structure of '${tableName}':`, Object.keys(data.Rows[0]));
        } else {
            // console.log(`Table '${tableName}' empty or format unknown.`);
        }

    } catch (error) {
        // console.log(`Table '${tableName}' error: ${error.message}`);
    }
}

async function main() {
    console.log('Searching for Master Data Tables...');
    for (const name of tableNames) {
        await checkTable(name);
    }
}

main();
