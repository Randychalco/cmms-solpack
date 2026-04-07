const { Area } = require('./src/models');
require('dotenv').config();

async function listAllAreas() {
    try {
        const areas = await Area.findAll();
        console.log(`Total Areas in DB: ${areas.length}`);
        areas.forEach(a => console.log(`ID: ${a.id}, Name: ${a.name}, PlantID: ${a.plantId}`));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

listAllAreas();
