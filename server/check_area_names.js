const { Area } = require('./src/models');

async function checkAreas() {
    try {
        const areas = await Area.findAll();
        console.log('--- AREAS IN DATABASE ---');
        areas.forEach(a => console.log(`- "${a.name}" (ID: ${a.id})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAreas();
