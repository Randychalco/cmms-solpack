const appId = process.env.APPSHEET_APP_ID;
const accessKey = process.env.APPSHEET_ACCESS_KEY;

/**
 * Service to interact with AppSheet API
 */
const AppSheetService = {
    /**
     * Fetch all rows from a specific table
     * @param {string} tableName - Name of the AppSheet table
     * @returns {Promise<Array>} - Array of rows
     */
    async getTableData(tableName) {
        if (!appId || !accessKey) {
            throw new Error('AppSheet credentials not configured in .env');
        }

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
                        Rows: [] // Empty array fetches all rows
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`AppSheet API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // AppSheet returns an array of rows directly or an object with "Rows" property
            if (Array.isArray(data)) {
                return data;
            } else if (data.Rows && Array.isArray(data.Rows)) {
                return data.Rows;
            } else {
                return [];
            }
        } catch (error) {
            console.error(`Error fetching table ${tableName}:`, error.message);
            throw error;
        }
    }
};

module.exports = AppSheetService;
