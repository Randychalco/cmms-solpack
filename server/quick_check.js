const sequelize = require('./src/config/sequelize');

async function quickCheck() {
    try {
        await sequelize.authenticate();

        // Simple count
        const [result] = await sequelize.query(`
            SELECT 
                "equipment_condition", 
                "order_class",
                COUNT(*) as count
            FROM "WorkOrders"
            WHERE "equipment_condition" IS NOT NULL
            AND "order_class" IS NOT NULL
            GROUP BY "equipment_condition", "order_class"
            ORDER BY count DESC
        `);

        console.log('Equipment Conditions and Order Classes:');
        console.log(JSON.stringify(result, null, 2));

        await sequelize.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

quickCheck();
