const { Machine } = require('./src/models');
require('dotenv').config();

async function checkMachine() {
    try {
        const machine = await Machine.findOne({ where: { name: 'SML 1' } });
        if (machine) {
            console.log('Machine found:', machine.toJSON());
        } else {
            console.log('Machine SML 1 NOT found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkMachine();
