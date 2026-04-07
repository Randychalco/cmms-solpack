const appId = '4b878ec7-ee1b-4792-8a07-834843a23b3b';
const accessKey = 'V2-kNVxW-BbXcH-uXnJv-D54Rc-ezaAG-spZhL-uCoHQ-7Tps1';
const tableName = 'Maquinaria';

async function main() {
    console.log(`Fetching ${tableName}...`);
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

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response length: ${text.length}`);
        if (text.length > 0) {
            console.log(`Snippet: ${text.substring(0, 500)}`);
            try {
                const data = JSON.parse(text);
                console.log(`Parsed ${data.length || (data.Rows ? data.Rows.length : 0)} rows.`);
            } catch (e) {
                console.log('Failed to parse JSON.');
            }
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

main();
