const { User } = require('./src/models');
const { hashPassword } = require('./src/utils/auth'); // Check path again, it should be correct as per list_dir
require('dotenv').config();

async function listUsers() {
    try {
        const users = await User.findAll();
        console.log('Users found:', users.map(u => ({ id: u.id, name: u.name, role: u.role })));

        const tech = await User.findOne({ where: { role: 'technician' } });
        if (!tech) {
            console.log('Creating a dummy technician...');
            const hashedPassword = await hashPassword('123456');
            await User.create({
                name: 'Juan Perez',
                email: 'juan.perez@example.com',
                password_hash: hashedPassword,
                role: 'technician'
            });
            console.log('Dummy technician created.');
        } else {
            console.log('Technician already exists.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

listUsers();
