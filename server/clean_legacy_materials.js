const { Sequelize } = require('sequelize');
const { WorkOrder, sequelize } = require('./src/models');

async function cleanLegacyMaterials() {
    try {
        console.log('Iniciando limpieza de materiales manuales en Work Orders...');

        // Count how many orders have materials_used not null
        const ordersToUpdate = await WorkOrder.count({
            where: {
                materials_used: {
                    [Sequelize.Op.ne]: null
                }
            }
        });

        console.log(`Encontradas ${ordersToUpdate} Órdenes de Trabajo con registro de materiales de forma antigua.`);

        if (ordersToUpdate === 0) {
            console.log('No hay registros antiguos que limpiar. Terminando.');
            return;
        }

        // Run the update
        const [updatedRows] = await WorkOrder.update(
            { materials_used: null },
            {
                where: {
                    materials_used: {
                        [Sequelize.Op.ne]: null
                    }
                }
            }
        );

        console.log(`Limpieza completada exitosamente. Se actualizaron ${updatedRows} registros.`);

    } catch (error) {
        console.error('Error durante la limpieza de la base de datos:', error);
    } finally {
        await sequelize.close();
        console.log('Conexión a la base de datos cerrada.');
    }
}

cleanLegacyMaterials();
