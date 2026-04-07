const db = require('./src/config/db');

async function removeAllRowNumbering() {
    try {
        const res = await db.query("SELECT id, name, items FROM checklist_templates");
        
        console.log(`Checking ${res.rows.length} templates...`);

        for (const template of res.rows) {
            try {
                console.log(`Processing template: ${template.name} (ID: ${template.id})`);
                let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
                
                if (!items || !items.sections) {
                    console.log(`- Skipping ${template.name} (no sections)`);
                    continue;
                }

                let changed = false;
                for (const section of items.sections) {
                    if (section.rows) {
                        for (const row of section.rows) {
                            const originalLabel = row.label;
                            if (originalLabel && typeof originalLabel === 'string') {
                                const newLabel = originalLabel.replace(/^\d+\.\s+/, '');
                                if (newLabel !== originalLabel) {
                                    row.label = newLabel;
                                    changed = true;
                                }
                            }
                        }
                    }
                    if (section.items) {
                        for (const item of section.items) {
                            if (item.label && typeof item.label === 'string') {
                                const originalLabel = item.label;
                                const newLabel = originalLabel.replace(/^\d+\.\s+/, '');
                                if (newLabel !== originalLabel) {
                                    item.label = newLabel;
                                    changed = true;
                                }
                            }
                        }
                    }
                }

                if (changed) {
                    console.log(`- Cleaned row labels in template: ${template.name}`);
                    await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
                }
            } catch (innerError) {
                console.error(`Error processing template ${template.name}:`, innerError.message);
            }
        }

        console.log('\nGlobal cleanup completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error during global cleanup:', error);
        process.exit(1);
    }
}

removeAllRowNumbering();
