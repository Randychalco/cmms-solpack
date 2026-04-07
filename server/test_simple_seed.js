const db = require('./src/config/db');

async function testSeed() {
    try {
        console.log('Testing simple INSERT into checklist_templates...');
        await db.query(
            "INSERT INTO checklist_templates (name, asset_category, layout, items) VALUES ($1, $2, $3, $4)", 
            ['DIAGNOSTIC_TEST', 'TEST_CAT', 'default', { foo: 'bar', timestamp: new Date() }]
        );
        console.log('✅ TEST INSERT SUCCESSFUL');
        
        const res = await db.query("SELECT * FROM checklist_templates WHERE name = $1", ['DIAGNOSTIC_TEST']);
        console.log('Data retrieved:', res.rows[0]);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ TEST INSERT FAILED:', error);
        process.exit(1);
    }
}

testSeed();
