const db = require('./src/models');
const { ChecklistTemplate } = db;

async function deleteOldTemplates() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected.');

    const templates = await ChecklistTemplate.findAll({
      where: {
        name: ['Checklist Diario SML 1', 'Checklist Diario SML 2']
      }
    });

    console.log(`Found ${templates.length} templates to delete.`);

    for (const t of templates) {
      console.log(`Deleting ${t.name} (ID: ${t.id})...`);
      // check if it has executions first
      // Assuming it's simpler to just destroy or set inactive. Let's try destroy, if foreign key fails, we set is_active=false.
      try {
        await t.destroy();
        console.log(`Deleted successfully.`);
      } catch(e) {
        console.log(`Destroy failed (possibly due to foreign constraints). Setting is_active to false instead...`);
        t.is_active = false;
        await t.save();
        console.log(`Deactivated instead.`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

deleteOldTemplates();
