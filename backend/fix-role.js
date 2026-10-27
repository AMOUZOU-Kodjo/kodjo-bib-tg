import { pool } from './src/config/db.js';

async function fix() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin'))");
    console.log('done');
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
fix();
