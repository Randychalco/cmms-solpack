const { Area } = require('./src/models');
const sequelize = require('./src/config/sequelize');

async function deleteAreas() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');

        // Areas to delete
        const areasToDelete = [
            'SER',
            'AUX STRETCH',
            'SERV',
            'AUX RECICLAJE'
        ];

        for (const areaName of areasToDelete) {
            const result = await Area.destroy({
                where: {
                    name: areaName
                }
            });

            if (result > 0) {
                console.log(`✓ Deleted area "${areaName}" (${result} record(s))`);
            } else {
                console.log(`  Area "${areaName}" not found`);
            }
        }

        console.log('\n✅ Cleanup completed!');
        await sequelize.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

deleteAreas();
