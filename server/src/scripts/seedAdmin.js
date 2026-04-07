const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function seedAdmin() {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt); // Default password

        const userExists = await pool.query("SELECT * FROM users WHERE email = 'admin@solpack.com'");

        if (userExists.rows.length === 0) {
            await pool.query(
                "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
                ['Admin User', 'admin@solpack.com', hashedPassword, 'admin']
            );
            console.log('Admin user created: admin@solpack.com / admin123');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (err) {
        console.error('Error seeding admin:', err);
    } finally {
        await pool.end();
    }
}

seedAdmin();
