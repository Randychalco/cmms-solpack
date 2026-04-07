const { syncDatabase } = require('../models');
const MasterDataSeeder = require('../services/masterDataSeeder');
require('dotenv').config({ path: '../../.env' }); // Adjust path if running from src/scripts

async function run() {
    await syncDatabase();
    const result = await MasterDataSeeder.seedFromAppSheet();
    console.log('Seed Result:', result);
    process.exit();
}

run();
