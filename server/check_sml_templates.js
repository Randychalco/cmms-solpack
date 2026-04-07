const db = require('./src/models');
const { ChecklistTemplate } = db;
const fs = require('fs');

async function checkTemplates() {
  try {
    await db.sequelize.authenticate();
    const templates = await ChecklistTemplate.findAll();

    let SMLTemplates = templates.filter(t => t.name.includes('SML'));
    
    let output = '';
    SMLTemplates.forEach(t => {
       output += `- ${t.name} (Active: ${t.is_active}) ID: ${t.id}\n`;
    });
    
    fs.writeFileSync('sml_res.txt', output, 'utf8');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkTemplates();
