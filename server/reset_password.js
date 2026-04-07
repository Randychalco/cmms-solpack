require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    const client = await pool.connect();
    try {
        // Verificar hash actual
        const result = await client.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', ['admin@solpack.com']);
        const user = result.rows[0];
        if (!user) { console.log('Usuario no encontrado'); return; }

        console.log('Hash actual:', user.password_hash);

        // Probar contraseñas comunes
        const passwords = ['admin123', 'admin', 'solpack', 'solpack123', '123456', 'Admin123', 'Admin123!'];
        for (const pwd of passwords) {
            const match = await bcrypt.compare(pwd, user.password_hash);
            if (match) {
                console.log('✅ Contraseña correcta:', pwd);
                return;
            }
        }
        console.log('❌ Ninguna contraseña conocida coincide.');

        // Resetear a "admin123"
        const newHash = await bcrypt.hash('admin123', 10);
        await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, 'admin@solpack.com']);
        console.log('✅ Contraseña reseteada a: admin123');
    } catch (e) {
        console.error(e.message);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
