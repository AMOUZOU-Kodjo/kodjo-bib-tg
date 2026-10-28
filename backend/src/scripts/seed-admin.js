import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

async function seedAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'phipsipy@gmail.com';
    const password = process.env.ADMIN_PASSWORD;
    const displayName = process.env.ADMIN_NAME || 'Administrateur';

    if (!password) {
      console.error('ADMIN_PASSWORD est requis pour lancer ce script.');
      process.exit(1);
    }

    if (password.length < 12) {
      console.error('ADMIN_PASSWORD doit contenir au moins 12 caractères.');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const exists = await query("SELECT id, role FROM users WHERE email = $1", [email.toLowerCase()]);
    
    if (exists.rows.length > 0) {
      await query("UPDATE users SET role = 'admin', email_verified = true, password_hash = $1 WHERE email = $2", [passwordHash, email.toLowerCase()]);
      console.log('Compte admin mis à jour');
    } else {
      const res = await query(
        "INSERT INTO users (email, display_name, password_hash, email_verified, role, credits) VALUES ($1,$2,$3,true,'admin',1000) RETURNING id",
        [email.toLowerCase(), displayName, passwordHash]
      );
      await query("INSERT INTO credit_transactions (user_id, delta, reason) VALUES ($1,1000,'initial')", [res.rows[0].id]);
      console.log('Compte admin créé');
    }

    console.log('Email:', email.toLowerCase());
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

seedAdmin();
