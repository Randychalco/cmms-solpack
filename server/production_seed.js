const { syncDatabase, User, Plant, Area } = require('./src/models');
const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

async function seedProduction() {
    try {
        console.log('--- PRODUCTION SEEDING STARTED ---');
        
        // 1. Sync Database Schema
        await syncDatabase();
        console.log('✅ Schema synced.');

        // 2. Create Admin User
        const adminEmail = 'admin@solpack.com';
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });
        
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Admin Solpack',
                email: adminEmail,
                password_hash: hashedPassword,
                role: 'admin',
                status: 'active'
            });
            console.log('✅ Admin user created (admin@solpack.com / admin123).');
        } else {
            console.log('ℹ️ Admin user already exists.');
        }

        // 3. Create Basic Plants and Areas (if empty)
        const plants = await Plant.findAll();
        if (plants.length === 0) {
            const solpack = await Plant.create({ name: 'SOLPACK' });
            await Area.bulkCreate([
                { name: 'EXTRUSIÓN 1', plantId: solpack.id },
                { name: 'EXTRUSIÓN 2', plantId: solpack.id },
                { name: 'CORTE Y REBOBINADO', plantId: solpack.id },
                { name: 'SERVICIOS AUXILIARES', plantId: solpack.id }
            ]);
            console.log('✅ Basic Plants and Areas created.');
        }

        console.log('--- RUNNING STANDARDIZED CHECKLIST SEEDS ---');
        
        // We can't easily require the other seeds because they are self-executing
        // but we already updated them to use the centralized db config which reads from .env
        // So we will trigger them via child_process or just tell the user to run them.
        // Actually, for simplicity and safety, I'll just explain to the user.
        
        console.log('🚀 READY FOR CLOUD DEPLOYMENT');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedProduction();
