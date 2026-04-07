const db = require('./server/src/config/db');
async function test() {
  try {
    const res = await db.query('SELECT NOW()');
    console.log('DB Connection OK:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('DB Connection Error:', err.message);
    process.exit(1);
  }
}
test();
