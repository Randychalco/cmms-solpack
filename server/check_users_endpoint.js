const axios = require('axios');
require('dotenv').config();
const { User } = require('./src/models');
const { hashPassword } = require('./src/utils/auth');

async function checkUsers() {
    try {
        // 1. Check if a technician exists in DB
        const techCount = await User.count({ where: { role: 'technician' } });
        console.log(`Found ${techCount} technicians in DB.`);

        if (techCount === 0) {
            console.log('Creating a dummy technician...');
            const hashedPassword = await hashPassword('123456');
            await User.create({
                name: 'Juan Perez',
                email: 'juan.perez@example.com',
                password_hash: hashedPassword,
                role: 'technician'
            });
            console.log('Dummy technician created.');
        }

        // 2. Test the API endpoint (requires a valid token, so we'll skip direct API call here and rely on DB check for now, 
        // or we could login first. Let's just verify DB state since we trust the controller logic if DB has data).
        // Actually, let's try to login as the technician to get a token and then hit the endpoint.

        // login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'juan.perez@example.com',
            password: '123456'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token obtained.');

        // fetch users
        const usersRes = await axios.get('http://localhost:5000/api/users?role=technician', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('API /api/users response:', usersRes.data);
        if (usersRes.data.length > 0) {
            console.log('SUCCESS: Users fetched correctly.');
        } else {
            console.error('FAILURE: No users returned from API.');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

checkUsers();
