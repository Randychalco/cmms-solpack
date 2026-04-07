const db = require('./src/config/db');
const { hashPassword } = require('./src/utils/auth');

const testRegister = async () => {
    try {
        console.log('Testing registration...');

        const email = 'debug_user_' + Date.now() + '@example.com';
        const password = 'password123';
        const hashedPassword = await hashPassword(password);

        console.log('Password hashed:', hashedPassword);

        const res = await db.query(
            'INSERT INTO users (name, email, password_hash, role, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, name, email, role, status',
            ['Debug User', email, hashedPassword, 'technician', 'pending']
        );

        console.log('User registered successfully:', res.rows[0]);
    } catch (error) {
        console.error('Registration failed:', error);
    } finally {
        process.exit();
    }
};

testRegister();
