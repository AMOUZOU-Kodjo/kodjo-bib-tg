import bcrypt from 'bcryptjs';
import { query } from './src/config/db.js';

async function createAdmin() {
  try {
    const email = 'admin@archives.fr';
    const password = 'admin123456';
    const displayName = 'Administrateur';
    const passwordHash = await bcrypt.hash(password, 10);
    
    const exists = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length > 0) {
      await query("UPDATE users SET role = 'admin', email_verified = true WHERE email = $1", [email]);
      console.log('Admin updated');
    } else {
      await query(
        "INSERT INTO users (email, display_name, password_hash, email_verified, role, credits) VALUES ($1,$2,$3,true,'admin',100)",
        [email, displayName, passwordHash]
      );
      console.log('Admin created');
    }
    console.log('Email:', email);
    console.log('Password:', password);
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
createAdmin();
