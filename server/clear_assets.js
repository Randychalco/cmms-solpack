const { Asset, sequelize } = require('./src/models');

async function clearAssets() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');
        const count = await Asset.destroy({ where: {}, truncate: true, cascade: true });
        console.log(`Deleted assets. Database cleared.`);
    } catch (error) {
        console.error('Error clearing assets:', error);
    } finally {
        process.exit();
    }
}

clearAssets();
